const mentorService = require('../services/mentorService');

class MentorController {

  // === ADMIN/SUPERADMIN ENDPOINTS ===

  // Tüm mentorleri listele
  async getAllMentors(req, res) {
    try {
      const filters = {
        isActive: req.query.isActive === 'false' ? false : req.query.isActive === 'true' ? true : undefined,
        search: req.query.search && req.query.search !== 'undefined' ? req.query.search : undefined,
        ideathonId: req.ideathonId || undefined
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || '-createdAt'
      };

      const result = await mentorService.getAllMentors(filters, options);

      res.status(200).json({
        success: true,
        data: result.mentors,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Mentor detayını getir
  async getMentor(req, res) {
    try {
      const mentor = await mentorService.getMentorById(req.params.id);

      res.status(200).json({
        success: true,
        data: mentor
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ||
                        error.message.includes('Geçersiz') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Yeni mentor oluştur
  async createMentor(req, res) {
    try {
      const mentorData = {
        name: req.body.name,
        status: req.body.status,
        description: req.body.description,
        order: req.body.order || 0,
        // Multi-Tenant: ideathonId body veya middleware'den
        ideathonId: req.body.ideathonId || req.ideathonId || undefined
      };

      // Validation
      if (!mentorData.name || !mentorData.status || !mentorData.description) {
        return res.status(400).json({
          success: false,
          message: 'Mentör adı, statüsü ve açıklaması zorunludur'
        });
      }

      const mentor = await mentorService.createMentor(mentorData, req.file, req.user._id);

      res.status(201).json({
        success: true,
        message: 'Mentör başarıyla oluşturuldu',
        data: mentor
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Mentor güncelle
  async updateMentor(req, res) {
    try {
      const updateData = {
        name: req.body.name,
        status: req.body.status,
        description: req.body.description,
        order: req.body.order,
        isActive: req.body.isActive
      };

      // Validation - en az bir alan zorunlu
      const hasValidUpdate = Object.values(updateData).some(value =>
        value !== undefined && value !== null && value !== ''
      );

      if (!hasValidUpdate && !req.file) {
        return res.status(400).json({
          success: false,
          message: 'Güncellenecek en az bir alan zorunludur'
        });
      }

      const mentor = await mentorService.updateMentor(req.params.id, updateData, req.file);

      res.status(200).json({
        success: true,
        message: 'Mentör başarıyla güncellendi',
        data: mentor
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Mentor sil (soft delete)
  async deleteMentor(req, res) {
    try {
      const result = await mentorService.deleteMentor(req.params.id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Mentor kalıcı olarak sil
  async hardDeleteMentor(req, res) {
    try {
      const result = await mentorService.hardDeleteMentor(req.params.id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Mentor sıralamasını güncelle
  async updateMentorOrder(req, res) {
    try {
      const { order } = req.body;

      if (order === undefined || order < 0) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli bir sıralama numarası zorunludur'
        });
      }

      const mentor = await mentorService.updateMentorOrder(req.params.id, order);

      res.status(200).json({
        success: true,
        message: 'Mentör sıralaması güncellendi',
        data: mentor
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // === PUBLIC ENDPOINTS ===

  // Aktif mentorleri getir
  async getActiveMentors(req, res) {
    try {
      const mentors = await mentorService.getActiveMentors();

      res.status(200).json({
        success: true,
        data: mentors,
        count: mentors.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // === STATISTICS ENDPOINTS ===

  // Mentor istatistikleri
  async getMentorStats(req, res) {
    try {
      const ideathonId = req.ideathonId || undefined;
      const stats = await mentorService.getMentorStats(ideathonId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // === SUPERADMIN ENDPOINTS ===

  // Tüm mentorler istatistiklerle birlikte
  async getAllMentorsWithStats(req, res) {
    try {
      const filters = {
        isActive: req.query.isActive === 'false' ? false : req.query.isActive === 'true' ? true : undefined,
        search: req.query.search && req.query.search !== 'undefined' ? req.query.search : undefined,
        ideathonId: req.ideathonId || undefined
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || '-createdAt'
      };

      const result = await mentorService.getAllMentorsWithStats(filters, options);

      res.status(200).json({
        success: true,
        data: result.mentors,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Dashboard genel istatistikleri
  async getDashboardStats(req, res) {
    try {
      const ideathonId = req.ideathonId || undefined;
      const stats = await mentorService.getDashboardStats(ideathonId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Tekil mentor detaylı istatistikleri
  async getMentorDetailedStats(req, res) {
    try {
      const ideathonId = req.ideathonId || undefined;
      const stats = await mentorService.getMentorDetailedStats(req.params.id, ideathonId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ||
                        error.message.includes('Geçersiz') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new MentorController();



