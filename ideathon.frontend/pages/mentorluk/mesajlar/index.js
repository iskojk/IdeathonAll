import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { messagingAPI } from '@/lib/api';
import { notify } from '@/components/Notification';
import Head from 'next/head';
import Link from 'next/link';

export default function MesajlarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { socket, onlineUsers: socketOnlineUsers } = useSocket();
  
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
    }
  };

  // Konuşmaları yükle
  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await messagingAPI.getConversations(false);
      setConversations(response.data || []);
    } catch (err) {
      console.error('Konuşmalar yüklenemedi:', err);
      setError(err.message || 'Konuşmalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Mesajları yükle
  const loadMessages = async (conversationId) => {
    if (!conversationId) return;
    
    try {
      setMessagesLoading(true);
      const response = await messagingAPI.getMessages(conversationId, 100, 0);
      // Mesajları tarih sırasına göre sırala (eskiden yeniye)
      const sortedMessages = (response.data || []).sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      setMessages(sortedMessages);
      
      // Okundu işaretle
      await messagingAPI.markAsRead(conversationId);
      
      // Mesajlar yüklendikten SONRA scroll yap
      setTimeout(() => {
        if (messagesEndRef.current) {
          const container = messagesEndRef.current.parentElement;
          if (container) {
            // Direkt scrollHeight'a git (instant scroll)
            container.scrollTop = container.scrollHeight;
          }
        }
      }, 150);
    } catch (err) {
      console.error('Mesajlar yüklenemedi:', err);
      notify.error('Mesajlar yüklenemedi');
    } finally {
      setMessagesLoading(false);
    }
  };

  // Konuşma seç
  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setMessagesLoading(true);
    await loadMessages(conversation._id);
    
    // Socket room'una katıl
    if (socket) {
      socket.emit('join:conversation', { conversationId: conversation._id });
    }
    
    // Karşı tarafın online durumunu kontrol et
    const otherParticipant = conversation.participants?.find((p) => p._id !== user?._id);
    if (otherParticipant) {
      checkOnlineStatus(otherParticipant._id);
    }
  };

  // Mobilde konuşma listesine dön
  const backToConversations = () => {
    setSelectedConversation(null);
    setMessages([]);
  };

  // Online durum kontrolü
  const checkOnlineStatus = async (userId) => {
    try {
      const response = await messagingAPI.getOnlineStatus(userId);
      if (response.success && response.data.isOnline) {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.add(userId);
          return newSet;
        });
      }
    } catch (err) {
      console.error('Online durum kontrol edilemedi:', err);
    }
  };

  // İlk yükleme
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // URL'den conversation seç
  useEffect(() => {
    const conversationId = router.query.conversation;
    if (conversationId && conversations.length > 0 && !selectedConversation) {
      const conv = conversations.find(c => c._id === conversationId);
      if (conv) {
        selectConversation(conv);
      }
    }
  }, [router.query.conversation, conversations]);

  // Socket online users'ı local state'e senkronize et
  useEffect(() => {
    if (socketOnlineUsers) {
      setOnlineUsers(socketOnlineUsers);
    }
  }, [socketOnlineUsers]);

  // Socket event'lerini dinle
  useEffect(() => {
    if (!socket) return;

    // Online/offline event'lerini dinle
    socket.on('user:online', (data) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(data.userId);
        return newSet;
      });
    });

    socket.on('user:offline', (data) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    // Yeni mesaj geldiğinde
    socket.on('message:new', (message) => {
      
      // Konuşma listesini güncelle
      loadConversations();
      
      // Eğer açık konuşmaya aitse mesaj listesine ekle
      if (selectedConversation && message.conversationId === selectedConversation._id) {
        // Duplicate kontrolü - kendi gönderdiğimiz mesaj socket'ten tekrar gelebilir
        setMessages((prev) => {
          const exists = prev.some(msg => msg._id === message._id);
          if (!exists) {
            return [...prev, message];
          }
          return prev;
        });
        setTimeout(() => scrollToBottom(), 100);
        
        // Okundu işaretle
        if (message.senderUserId?._id !== user?._id) {
          messagingAPI.markAsRead(selectedConversation._id);
        }
      } else {
        // Farklı konuşmaya geldiyse bildirim göster
        if (message.senderUserId?._id !== user?._id) {
          notify.info(`${message.senderUserId?.name}: ${message.text.substring(0, 50)}...`);
        }
      }
    });

    // Karşı taraf yazıyor
    socket.on('user:typing', (data) => {
      if (selectedConversation && data.conversationId === selectedConversation._id && data.userId !== user?._id) {
        setIsTyping(true);
        setTypingUser(data.userName);
      }
    });

    // Karşı taraf yazmayı bıraktı
    socket.on('user:stop-typing', (data) => {
      if (selectedConversation && data.conversationId === selectedConversation._id && data.userId !== user?._id) {
        setIsTyping(false);
        setTypingUser(null);
      }
    });

    // Mesaj okundu
    socket.on('message:read', (data) => {
      if (selectedConversation && data.conversationId === selectedConversation._id) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.senderUserId?._id === user?._id) {
              return { ...msg, isRead: true, readAt: data.readAt };
            }
            return msg;
          })
        );
      }
    });

    return () => {
      socket.off('message:new');
      socket.off('user:typing');
      socket.off('user:stop-typing');
      socket.off('message:read');
      socket.off('user:online');
      socket.off('user:offline');
    };
  }, [socket, selectedConversation, user]);

  // Typing indicator gönder
  const handleTyping = () => {
    if (!socket || !selectedConversation) return;
    
    socket.emit('message:send', { conversationId: selectedConversation._id });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('message:stop-typing', { conversationId: selectedConversation._id });
    }, 1000);
  };

  // Mesaj gönder
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || sending || !selectedConversation) return;
    
    try {
      setSending(true);
      const response = await messagingAPI.sendMessage(selectedConversation._id, messageText.trim());
      
      // Mesajı eklerken duplicate kontrolü yap
      const newMessage = response.data;
      setMessages((prev) => {
        // Aynı ID'ye sahip mesaj yoksa ekle
        const exists = prev.some(msg => msg._id === newMessage._id);
        if (!exists) {
          return [...prev, newMessage];
        }
        return prev;
      });
      
      setMessageText('');
      
      if (socket) {
        socket.emit('message:stop-typing', { conversationId: selectedConversation._id });
      }
      
      // Konuşma listesini güncelle
      loadConversations();
    } catch (err) {
      console.error('Mesaj gönderilemedi:', err);
      notify.error('Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  // Karşı tarafı bul
  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find((p) => p._id !== user?._id);
  };

  // Tarih formatlama
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins}dk`;
    if (diffHours < 24) return `${diffHours}sa`;
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays}g`;
    
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Bugün';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Dün';
    } else {
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currentDate !== prevDate;
  };

  // Filtrelenmiş konuşmalar
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const otherParticipant = getOtherParticipant(conv);
    const name = otherParticipant?.name?.toLowerCase() || '';
    const email = otherParticipant?.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  return (
    <>
      <Head>
        <title>Mesajlarım - Emlak Konut</title>
      </Head>
      
      <Layout>
        <div className="messaging-wrapper">
          <div className="container">
            <div className="messaging-container">
          {/* Sol Panel - Konuşma Listesi */}
          <div className={`conversations-panel ${selectedConversation ? 'mobile-hidden' : ''}`}>
            <div className="conversations-header">
              <h2>Mesajlar</h2>
              <Link href="/mentorluk/mentorlar" className="btn-new-chat">
                <i className="bi bi-plus-lg"></i>
              </Link>
            </div>

            <div className="search-box">
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Kişi ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="conversations-list">
              {loading ? (
                // Loading skeleton
                [...Array(5)].map((_, i) => (
                  <div key={i} className="conversation-item skeleton">
                    <div className="conv-avatar skeleton-avatar"></div>
                    <div className="conv-content">
                      <div className="skeleton-line" style={{ width: '60%' }}></div>
                      <div className="skeleton-line" style={{ width: '80%', marginTop: '8px' }}></div>
                    </div>
                  </div>
                ))
              ) : filteredConversations.length === 0 ? (
                <div className="empty-conversations">
                  <i className="bi bi-chat-dots"></i>
                  <p>Henüz mesajınız yok</p>
                  <Link href="/mentorluk/mentorlar" className="btn-start-chat">
                    Mentorları Görüntüle
                  </Link>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const otherParticipant = getOtherParticipant(conv);
                  const isOnline = onlineUsers.has(otherParticipant?._id);
                  const isSelected = selectedConversation?._id === conv._id;
                  
                  return (
                    <div
                      key={conv._id}
                      className={`conversation-item ${isSelected ? 'active' : ''} ${conv.unreadCount > 0 ? 'unread' : ''}`}
                      onClick={() => selectConversation(conv)}
                    >
                      <div className="conv-avatar-wrapper">
                        {otherParticipant?.profileImage ? (
                          <img
                            src={otherParticipant.profileImage.startsWith('http') 
                              ? otherParticipant.profileImage 
                              : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${otherParticipant.profileImage}`}
                            alt={otherParticipant.name}
                            className="conv-avatar"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="conv-avatar placeholder"
                          style={{ display: otherParticipant?.profileImage ? 'none' : 'flex' }}
                        >
                          {otherParticipant?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className={`online-dot ${isOnline ? 'online' : ''}`}></span>
                      </div>

                      <div className="conv-content">
                        <div className="conv-header">
                          <h4>{otherParticipant?.name || 'Kullanıcı'}</h4>
                          <span className="conv-time">
                            {formatDate(conv.lastMessage?.createdAt || conv.updatedAt)}
                          </span>
                        </div>
                        <div className="conv-footer">
                          <p className="conv-preview">
                            {conv.lastMessage?.text || ''}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="unread-count">{conv.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sağ Panel - Mesaj Detayı */}
          <div className={`messages-panel ${!selectedConversation ? 'mobile-hidden' : ''}`}>
            {!selectedConversation ? (
              <div className="no-conversation-selected">
                <i className="bi bi-chat-dots"></i>
                <h3>Bir konuşma seçin</h3>
                <p>Mesajlaşmaya başlamak için soldan bir konuşma seçin</p>
              </div>
            ) : (
              <>
                {/* Mesaj Header */}
                <div className="messages-header">
                  <div className="header-info" onClick={backToConversations}>
                    <div className="header-avatar-wrapper">
                      {getOtherParticipant(selectedConversation)?.profileImage ? (
                        <img
                          src={getOtherParticipant(selectedConversation).profileImage.startsWith('http') 
                            ? getOtherParticipant(selectedConversation).profileImage 
                            : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${getOtherParticipant(selectedConversation).profileImage}`}
                          alt={getOtherParticipant(selectedConversation)?.name}
                          className="header-avatar"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="header-avatar placeholder"
                        style={{ display: getOtherParticipant(selectedConversation)?.profileImage ? 'none' : 'flex' }}
                      >
                        {getOtherParticipant(selectedConversation)?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className={`online-dot ${onlineUsers.has(getOtherParticipant(selectedConversation)?._id) ? 'online' : ''}`}></span>
                    </div>
                    <div className="header-text">
                      <h3>{getOtherParticipant(selectedConversation)?.name || 'Kullanıcı'}</h3>
                      <span className="status-text">
                        {onlineUsers.has(getOtherParticipant(selectedConversation)?._id) ? (
                          <>
                            <span className="status-dot-online"></span>
                            Çevrimiçi
                          </>
                        ) : (
                          'Çevrimdışı'
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {getOtherParticipant(selectedConversation)?.role === 'mentor' && (
                    <Link
                      href={`/mentorluk/mentorlar/${getOtherParticipant(selectedConversation)._id}`}
                      className="btn-profile-icon"
                      title="Profili Görüntüle"
                    >
                      <i className="bi bi-person-circle"></i>
                    </Link>
                  )}
                </div>

                {/* Mesaj Listesi */}
                <div className="messages-content">
                  {messagesLoading ? (
                    <div className="messages-loading">
                      <div className="spinner-border text-primary"></div>
                      <p>Mesajlar yükleniyor...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="no-messages">
                      <i className="bi bi-chat-left-text"></i>
                      <p>Henüz mesaj yok. İlk mesajı gönderin!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, index) => {
                        const isMine = message.senderUserId?._id === user?._id;
                        const prevMessage = index > 0 ? messages[index - 1] : null;
                        const showDateSeparator = shouldShowDateSeparator(message, prevMessage);
                        
                        return (
                          <div key={message._id || index}>
                            {showDateSeparator && (
                              <div className="date-separator">
                                <span>{formatDateSeparator(message.createdAt)}</span>
                              </div>
                            )}
                            
                            <div className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                              {!isMine && (
                                <div className="msg-avatar">
                                  {getOtherParticipant(selectedConversation)?.profileImage ? (
                                    <img
                                      src={getOtherParticipant(selectedConversation).profileImage.startsWith('http') 
                                        ? getOtherParticipant(selectedConversation).profileImage 
                                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${getOtherParticipant(selectedConversation).profileImage}`}
                                      alt={getOtherParticipant(selectedConversation)?.name}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div 
                                    className="msg-avatar-placeholder"
                                    style={{ display: getOtherParticipant(selectedConversation)?.profileImage ? 'none' : 'flex' }}
                                  >
                                    {getOtherParticipant(selectedConversation)?.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                </div>
                              )}
                              
                              <div className="message-bubble">
                                <p>{message.text}</p>
                                <div className="message-meta">
                                  <span>{formatMessageTime(message.createdAt)}</span>
                                  {isMine && (
                                    <i className={`bi ${message.isRead ? 'bi-check-all text-primary' : 'bi-check-all'}`}></i>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {isTyping && typingUser && (
                        <div className="message-wrapper theirs typing-indicator">
                          <div className="msg-avatar">
                            <div className="msg-avatar-placeholder">
                              {typingUser.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="message-bubble typing">
                            <div className="typing-dots">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Mesaj Input */}
                <div className="messages-input">
                  <form onSubmit={handleSendMessage}>
                    <textarea
                      value={messageText}
                      onChange={(e) => {
                        setMessageText(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Mesajınızı yazın..."
                      rows="1"
                      disabled={sending}
                    />
                    <button type="submit" disabled={!messageText.trim() || sending}>
                      {sending ? (
                        <i className="bi bi-arrow-clockwise spinner"></i>
                      ) : (
                        <i className="bi bi-send-fill"></i>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
          </div>
        </div>
      </Layout>

      <style jsx>{`
        .messaging-wrapper {
          padding-top: 140px;
          padding-bottom: 40px;
          min-height: 100vh;
          background: #f9fafb;
        }

        .messaging-container {
          display: flex;
          height: calc(100vh - 220px);
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
        }

        /* Sol Panel - Konuşmalar */
        .conversations-panel {
          width: 380px;
          background: white;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
        }

        .conversations-header {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .conversations-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .btn-new-chat {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #005dad 0%, #0080ff 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-new-chat:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 93, 173, 0.3);
        }

        .search-box {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          position: relative;
        }

        .search-box i {
          position: absolute;
          left: 28px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          font-size: 16px;
        }

        .search-box input {
          width: 100%;
          padding: 10px 12px 10px 36px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .search-box input:focus {
          outline: none;
          border-color: #005dad;
          box-shadow: 0 0 0 3px rgba(0, 93, 173, 0.1);
        }

        .conversations-list {
          flex: 1;
          overflow-y: auto;
        }

        .conversations-list::-webkit-scrollbar {
          width: 6px;
        }

        .conversations-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .conversations-list::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;
        }

        .conversations-list::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }

        .conversation-item {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 1px solid #f3f4f6;
          position: relative;
        }

        .conversation-item:hover {
          background: #f9fafb;
        }

        .conversation-item.active {
          background: linear-gradient(to right, #eff6ff 0%, #f0f9ff 100%);
          border-left: 3px solid #005dad;
        }

        .conversation-item.unread {
          background: #f0f9ff;
          border-left: 4px solid #2563eb;
        }

        .conversation-item.unread::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 60%;
          background: linear-gradient(180deg, #2563eb 0%, #3b82f6 100%);
          border-radius: 0 4px 4px 0;
        }

        .conversation-item.skeleton {
          pointer-events: none;
        }

        .conv-avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .conversation-item.unread .conv-avatar-wrapper::after {
          content: '';
          position: absolute;
          top: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          background: #dc2626;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.4);
          z-index: 1;
        }

        .conv-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #f3f4f6;
        }

        .conversation-item.unread .conv-avatar {
          border-color: #2563eb;
        }

        .conv-avatar.placeholder {
          background: linear-gradient(135deg, #005dad 0%, #0080ff 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          border: 2px solid #f3f4f6;
        }

        .conversation-item.unread .conv-avatar.placeholder {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .online-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          background: #9ca3af;
          border: 3px solid white;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .online-dot.online {
          background: #10b981;
        }

        .conv-content {
          flex: 1;
          min-width: 0;
        }

        .conv-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .conv-header h4 {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .conversation-item.unread .conv-header h4 {
          font-weight: 700;
          color: #1d4ed8;
        }

        .conv-time {
          font-size: 12px;
          color: #9ca3af;
          flex-shrink: 0;
          margin-left: 8px;
        }

        .conv-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .conv-preview {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .conversation-item.unread .conv-preview {
          font-weight: 700;
          color: #1e40af;
        }

        .unread-count {
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 12px;
          min-width: 22px;
          text-align: center;
          flex-shrink: 0;
          margin-left: 8px;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
          animation: pulse-badge 2s ease-in-out infinite;
        }

        @keyframes pulse-badge {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .empty-conversations {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-conversations i {
          font-size: 64px;
          color: #d1d5db;
          margin-bottom: 16px;
        }

        .empty-conversations p {
          color: #6b7280;
          margin-bottom: 20px;
        }

        .btn-start-chat {
          display: inline-block;
          padding: 10px 20px;
          background: #005dad;
          color: white;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-start-chat:hover {
          background: #004a8f;
          transform: translateY(-2px);
        }

        /* Sağ Panel - Mesajlar */
        .messages-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #f8f9fa;
        }

        .messages-header {
          background: white;
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-avatar-wrapper {
          position: relative;
        }

        .header-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
        }

        .header-avatar.placeholder {
          background: linear-gradient(135deg, #005dad 0%, #0080ff 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
        }

        .header-text h3 {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0px 0;
          line-height: 1.2;
        }

        .status-text {
          font-size: 13px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-dot-online {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .btn-profile-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: #f3f4f6;
          color: #374151;
          border-radius: 10px;
          text-decoration: none;
          font-size: 20px;
          transition: all 0.2s;
        }

        .btn-profile-icon:hover {
          background: #e5e7eb;
          transform: scale(1.05);
        }

        .messages-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #f8f9fa;
        }

        .messages-content::-webkit-scrollbar {
          width: 6px;
        }

        .messages-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .messages-content::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }

        .messages-content::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        .no-conversation-selected,
        .messages-loading,
        .no-messages {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #9ca3af;
        }

        .no-conversation-selected i,
        .no-messages i {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .no-conversation-selected h3 {
          font-size: 20px;
          font-weight: 600;
          color: #6b7280;
          margin: 0 0 8px 0;
        }

        .no-conversation-selected p,
        .no-messages p {
          color: #9ca3af;
          margin: 0;
        }

        .messages-loading {
          gap: 16px;
        }

        .date-separator {
          text-align: center;
          margin: 16px 0;
        }

        .date-separator span {
          display: inline-block;
          background: white;
          color: #6b7280;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .message-wrapper {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        .message-wrapper.mine {
          flex-direction: row-reverse;
        }

        .msg-avatar {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
        }

        .msg-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .msg-avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #005dad 0%, #0080ff 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
        }

        .message-bubble {
          max-width: 65%;
          min-width: 120px;
          padding: 10px 14px;
          border-radius: 16px;
          word-wrap: break-word;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
        }

        .message-wrapper.theirs .message-bubble {
          background: #f3f4f6;
          border-bottom-left-radius: 4px;
        }

        .message-wrapper.mine .message-bubble {
          background: linear-gradient(135deg, #005dad 0%, #0080ff 100%);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message-bubble p {
          margin: 0 0 6px 0;
          font-size: 15px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .message-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          font-size: 11px;
          opacity: 0.8;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .message-wrapper.mine .message-meta {
          opacity: 0.9;
        }

        .typing-indicator .message-bubble {
          padding: 10px 16px;
        }

        .typing-dots {
          display: flex;
          gap: 4px;
        }

        .typing-dots span {
          width: 8px;
          height: 8px;
          background: #9ca3af;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-8px);
          }
        }

        .messages-input {
          background: white;
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
        }

        .messages-input form {
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }

        .messages-input textarea {
          flex: 1;
          min-height: 44px;
          max-height: 120px;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          font-family: inherit;
          resize: none;
          transition: all 0.2s;
        }

        .messages-input textarea:focus {
          outline: none;
          border-color: #005dad;
          box-shadow: 0 0 0 3px rgba(0, 93, 173, 0.1);
        }

        .messages-input button {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #005dad 0%, #0080ff 100%);
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .messages-input button:hover:not(:disabled) {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 93, 173, 0.3);
        }

        .messages-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .skeleton-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-line {
          height: 12px;
          border-radius: 6px;
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1024px) {
          .messaging-container {
            margin-top: 120px;
          }
          
          .conversations-panel {
            width: 320px;
          }
        }

        /* Desktop'ta mobile-hidden sınıfı etkilemesin */
        .mobile-hidden {
          display: flex;
        }

        @media (max-width: 768px) {
          .messaging-wrapper {
            padding-top: 100px;
            padding-bottom: 20px;
          }

          .messaging-container {
            height: calc(100vh - 140px);
            max-height: calc(100dvh - 140px);
            border-radius: 12px;
            overflow: hidden;
          }

          /* Mobilde WhatsApp gibi davranış */
          .mobile-hidden {
            display: none !important;
          }

          .conversations-panel {
            width: 100%;
          }

          .messages-panel {
            width: 100%;
          }

          .conversations-header {
            padding: 16px;
          }

          .conversations-header h2 {
            font-size: 20px;
          }

          .btn-new-chat {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }

          .search-box {
            padding: 12px 16px;
          }

          .search-box input {
            font-size: 15px;
          }

          .conversation-item {
            padding: 12px 16px;
          }

          .conv-avatar,
          .conv-avatar.placeholder {
            width: 48px;
            height: 48px;
            font-size: 18px;
          }

          .online-dot {
            width: 12px;
            height: 12px;
            border: 2px solid white;
          }

          .conv-header h4 {
            font-size: 14px;
          }

          .conv-preview {
            font-size: 13px;
          }

          /* Mesaj Header - Mobilde Geri Butonu Ekle */
          .messages-header {
            padding: 12px 16px;
          }

          .header-info {
            cursor: pointer;
          }

          .header-info::before {
            content: '←';
            font-size: 24px;
            color: #005dad;
            margin-right: 12px;
          }

          .header-avatar,
          .header-avatar.placeholder {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }

          .header-text h3 {
            font-size: 15px;
          }

          .status-text {
            font-size: 11px;
          }

          .btn-profile-icon {
            width: 36px;
            height: 36px;
            font-size: 18px;
          }

          /* Mesaj İçeriği */
          .messages-content {
            padding: 16px;
            gap: 8px;
          }

          .date-separator {
            margin: 8px 0;
          }

          .date-separator span {
            font-size: 11px;
            padding: 4px 12px;
          }

          .message-bubble {
            max-width: 80%;
            min-width: 100px;
            padding: 10px 12px;
          }

          .message-bubble p {
            font-size: 14px;
            margin-bottom: 4px;
          }

          .message-meta {
            font-size: 10px;
          }

          .msg-avatar,
          .msg-avatar-placeholder {
            width: 28px;
            height: 28px;
            font-size: 12px;
          }

          /* Mesaj Input */
          .messages-input {
            padding: 12px 16px;
          }

          .messages-input textarea {
            font-size: 15px;
            max-height: 100px;
          }

          .messages-input button {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }
        }

        @media (max-width: 480px) {
          .messaging-wrapper {
            padding-top: 90px;
            padding-bottom: 16px;
          }

          .messaging-container {
            height: calc(100vh - 120px);
            max-height: calc(100dvh - 120px);
            border-radius: 0;
            overflow: hidden;
          }

          .message-bubble {
            max-width: 85%;
            padding: 8px 10px;
          }

          .message-bubble p {
            font-size: 13px;
          }

          .conv-header h4 {
            font-size: 13px;
          }

          .conv-preview {
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
}
