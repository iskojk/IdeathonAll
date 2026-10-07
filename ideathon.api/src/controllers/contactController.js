const Contact = require('../models/Contact');
const emailService = require('../services/emailService');

class ContactController {
  // İletişim formu gönderimi
  async submitContactForm(req, res) {
    try {
      const { firstName, lastName, email, phone, message } = req.body;

      // Validasyon
      if (!firstName || !lastName || !email || !phone || !message) {
        return res.status(400).json({
          success: false,
          message: 'Tüm alanlar zorunludur'
        });
      }

      // İletişim formu oluştur
      const contact = new Contact({
        firstName,
        lastName,
        email,
        phone,
        message,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        // Multi-Tenant: ideathonId body veya query'den gelir
        ideathonId: req.body.ideathonId || req.ideathonId || undefined
      });

      await contact.save();

      // Adminlere email gönder - Şimdilik pasif
      /*
      try {
        await emailService.sendContactFormNotification(contact);
      } catch (emailError) {
        console.error('İletişim formu email gönderme hatası:', emailError.message);
        // Email hatası ana işlemi etkilemesin
      }
      */

      res.status(201).json({
        success: true,
        message: 'Mesajınız başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz.',
        data: {
          id: contact._id,
          createdAt: contact.createdAt
        }
      });

    } catch (error) {
      console.error('İletişim formu hatası:', error);

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validasyon hatası',
          errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'İletişim formu gönderilirken bir hata oluştu'
      });
    }
  }

  // İletişim formlarını listele (admin için)
  async getContactForms(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const skip = (page - 1) * limit;

      let query = {};
      if (status) {
        query.status = status;
      }

      // Multi-Tenant: ideathonId filtresi (admin middleware'den gelir)
      if (req.ideathonId) {
        query.ideathonId = req.ideathonId;
      }

      const contacts = await Contact.find(query)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Contact.countDocuments(query);

      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.json({
        success: true,
        data: {
          contacts,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalContacts: total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('İletişim formları listesi hatası:', error);
      res.status(500).json({
        success: false,
        message: 'İletişim formları getirilirken hata oluştu'
      });
    }
  }

  // İletişim formu detayını getir (admin için)
  async getContactForm(req, res) {
    try {
      const { id } = req.params;

      const contact = await Contact.findById(id);
      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'İletişim formu bulunamadı'
        });
      }

      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.json({
        success: true,
        data: contact
      });

    } catch (error) {
      console.error('İletişim formu detayı hatası:', error);
      res.status(500).json({
        success: false,
        message: 'İletişim formu detayı getirilirken hata oluştu'
      });
    }
  }

  // İletişim formu durumunu güncelle (admin için)
  async updateContactStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['new', 'read', 'replied', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz durum'
        });
      }

      const contact = await Contact.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
      );

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'İletişim formu bulunamadı'
        });
      }

      res.json({
        success: true,
        message: 'İletişim formu durumu güncellendi',
        data: contact
      });

    } catch (error) {
      console.error('İletişim formu durumu güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'İletişim formu durumu güncellenirken hata oluştu'
      });
    }
  }

  // İletişim formu istatistikleri (admin için)
  async getContactStats(req, res) {
    try {
      // Multi-Tenant: ideathonId filtresi
      const matchFilter = {};
      if (req.ideathonId) {
        matchFilter.ideathonId = req.ideathonId;
      }

      const stats = await Contact.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalContacts = await Contact.countDocuments(matchFilter);
      const todayFilter = {
        ...matchFilter,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      };
      const todayContacts = await Contact.countDocuments(todayFilter);

      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.json({
        success: true,
        data: {
          totalContacts,
          todayContacts,
          statusBreakdown: stats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        }
      });

    } catch (error) {
      console.error('İletişim formu istatistikleri hatası:', error);
      res.status(500).json({
        success: false,
        message: 'İletişim formu istatistikleri getirilirken hata oluştu'
      });
    }
  }
}

module.exports = new ContactController();

