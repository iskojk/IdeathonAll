const mongoose = require('mongoose');

const meetingFeedbackSchema = new mongoose.Schema({
  // Toplantı referansı
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorMeeting',
    required: [true, 'Toplantı ID zorunludur']
  },

  // Kim dolduruyor (mentor veya participant)
  filledByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Dolduran kullanıcı ID zorunludur']
  },

  // Feedback türü
  feedbackType: {
    type: String,
    enum: {
      values: ['mentor_to_participant', 'participant_to_mentor'],
      message: 'Feedback türü: mentor_to_participant veya participant_to_mentor olmalıdır'
    },
    required: true,
    description: 'Mentor mu katılımcıya, katılımcı mı mentöre feedback veriyor'
  },

  // Yıldız puanı (1-5)
  rating: {
    type: Number,
    required: [true, 'Puan zorunludur'],
    min: [1, 'Puan en az 1 olmalıdır'],
    max: [5, 'Puan en fazla 5 olabilir']
  },

  // Yorum
  comment: {
    type: String,
    trim: true,
    maxlength: [2000, 'Yorum en fazla 2000 karakter olabilir']
  },

  // Ek sorular (opsiyonel, genişletilebilir)
  additionalQuestions: [{
    question: {
      type: String,
      trim: true,
      maxlength: [500, 'Soru en fazla 500 karakter olabilir']
    },
    answer: {
      type: String,
      trim: true,
      maxlength: [2000, 'Cevap en fazla 2000 karakter olabilir']
    }
  }],

  // Öneriler
  suggestions: {
    type: String,
    trim: true,
    maxlength: [2000, 'Öneriler en fazla 2000 karakter olabilir']
  },

  // Toplantı tekrar isteniyor mu?
  wouldMeetAgain: {
    type: Boolean,
    default: null,
    description: 'Tekrar görüşmek ister misiniz?'
  },

  // Anonymous feedback mi (sadece participant için)
  isAnonymous: {
    type: Boolean,
    default: false
  },

  // Admin tarafından görünürlük kontrolü
  isVisible: {
    type: Boolean,
    default: true,
    description: 'Admin tarafından gizlenebilir'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index'ler
meetingFeedbackSchema.index({ meetingId: 1, filledByUserId: 1 }, { unique: true });
meetingFeedbackSchema.index({ meetingId: 1 });
meetingFeedbackSchema.index({ filledByUserId: 1 });
meetingFeedbackSchema.index({ rating: -1 });
meetingFeedbackSchema.index({ createdAt: -1 });

// Virtual for rating display
meetingFeedbackSchema.virtual('ratingStars').get(function() {
  return '⭐'.repeat(this.rating);
});

// Static methods
meetingFeedbackSchema.statics.findByMeeting = function(meetingId) {
  return this.find({ meetingId, isVisible: true })
    .populate('filledByUserId', 'name email')
    .sort({ createdAt: -1 });
};

meetingFeedbackSchema.statics.findByUser = function(userId) {
  return this.find({ filledByUserId: userId })
    .populate('meetingId')
    .sort({ createdAt: -1 });
};

meetingFeedbackSchema.statics.getMentorAverageRating = async function(mentorUserId) {
  const MentorMeeting = mongoose.model('MentorMeeting');
  
  // Mentor'un toplantılarını bul
  const meetings = await MentorMeeting.find({ mentorUserId }).select('_id');
  const meetingIds = meetings.map(m => m._id);
  
  // Bu toplantılara verilen feedbackleri bul (participant_to_mentor)
  const feedbacks = await this.find({
    meetingId: { $in: meetingIds },
    feedbackType: 'participant_to_mentor',
    isVisible: true
  });
  
  if (feedbacks.length === 0) {
    return {
      averageRating: 0,
      totalFeedbacks: 0
    };
  }
  
  const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
  const averageRating = totalRating / feedbacks.length;
  
  return {
    averageRating: Math.round(averageRating * 10) / 10, // 1 ondalık
    totalFeedbacks: feedbacks.length,
    ratingDistribution: {
      5: feedbacks.filter(f => f.rating === 5).length,
      4: feedbacks.filter(f => f.rating === 4).length,
      3: feedbacks.filter(f => f.rating === 3).length,
      2: feedbacks.filter(f => f.rating === 2).length,
      1: feedbacks.filter(f => f.rating === 1).length
    }
  };
};

// Feedback kaydedildiğinde MentorProfile stats'ını güncelle
meetingFeedbackSchema.post('save', async function() {
  if (this.feedbackType === 'participant_to_mentor') {
    try {
      const MentorMeeting = mongoose.model('MentorMeeting');
      const MentorProfile = mongoose.model('MentorProfile');
      
      const meeting = await MentorMeeting.findById(this.meetingId);
      if (meeting && meeting.mentorUserId) {
        const mentorProfile = await MentorProfile.findOne({ userId: meeting.mentorUserId });
        if (mentorProfile) {
          await mentorProfile.updateStats({ newRating: this.rating });
        }
      }
    } catch (error) {
      console.error('MentorProfile stats güncelleme hatası:', error);
    }
  }
});

module.exports = mongoose.model('MeetingFeedback', meetingFeedbackSchema);




















































