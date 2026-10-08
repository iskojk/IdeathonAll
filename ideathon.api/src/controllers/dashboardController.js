const User = require('../models/User');
const Application = require('../models/Application');
const Contact = require('../models/Contact');
const MentorProfile = require('../models/MentorProfile');
const Team = require('../models/Team');
const Ideathon = require('../models/Ideathon');
const TeamEvaluation = require('../models/TeamEvaluation');

class DashboardController {
  async getStats(req, res) {
    try {
      const ideathonId = req.ideathonId;

      const idFilter = ideathonId ? { ideathonId } : {};
      const userIdFilter = ideathonId ? { ideathonId, isActive: true } : { isActive: true };

      const [
        totalUsers,
        totalApplications,
        applicationsByStatus,
        contactStats,
        totalMentors,
        teamStats,
        ideathonStats,
        evaluationCount,
        recentApplications,
        recentContacts
      ] = await Promise.all([
        User.countDocuments(userIdFilter),

        Application.countDocuments(idFilter),

        Application.aggregate([
          { $match: idFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),

        Contact.aggregate([
          { $match: idFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),

        MentorProfile.countDocuments({ isActive: true, ...idFilter }),

        Team.aggregate([
          { $match: { isActive: true, ...idFilter } },
          {
            $group: {
              _id: null,
              totalTeams: { $sum: 1 },
              totalMembers: { $sum: { $size: { $ifNull: ['$members', []] } } }
            }
          }
        ]),

        Ideathon.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),

        TeamEvaluation.countDocuments({ status: 'submitted', ...idFilter }),

        Application.find(idFilter)
          .sort({ createdAt: -1 })
          .limit(5)
          .select('personalInfo.firstName personalInfo.lastName status createdAt')
          .lean(),

        Contact.find(idFilter)
          .sort({ createdAt: -1 })
          .limit(5)
          .select('firstName lastName email status createdAt')
          .lean()
      ]);

      const appStatusMap = {};
      applicationsByStatus.forEach(s => { appStatusMap[s._id] = s.count; });

      const contactStatusMap = {};
      contactStats.forEach(s => { contactStatusMap[s._id] = s.count; });

      const ideathonStatusMap = {};
      ideathonStats.forEach(s => { ideathonStatusMap[s._id] = s.count; });

      const teamData = teamStats[0] || { totalTeams: 0, totalMembers: 0 };

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers
          },
          applications: {
            total: totalApplications,
            byStatus: {
              pending: appStatusMap.pending || 0,
              under_review: appStatusMap.under_review || 0,
              approved: appStatusMap.approved || 0,
              rejected: appStatusMap.rejected || 0,
              withdrawn: appStatusMap.withdrawn || 0
            }
          },
          contacts: {
            total: Object.values(contactStatusMap).reduce((a, b) => a + b, 0),
            new: contactStatusMap.new || 0,
            read: contactStatusMap.read || 0,
            replied: contactStatusMap.replied || 0,
            closed: contactStatusMap.closed || 0
          },
          mentors: {
            total: totalMentors
          },
          teams: {
            total: teamData.totalTeams,
            totalMembers: teamData.totalMembers
          },
          ideathons: {
            total: Object.values(ideathonStatusMap).reduce((a, b) => a + b, 0),
            byStatus: {
              active: ideathonStatusMap.active || 0,
              draft: ideathonStatusMap.draft || 0,
              completed: ideathonStatusMap.completed || 0,
              archived: ideathonStatusMap.archived || 0
            }
          },
          evaluations: {
            submitted: evaluationCount
          },
          recent: {
            applications: recentApplications.map(a => ({
              _id: a._id,
              name: `${a.personalInfo?.firstName || ''} ${a.personalInfo?.lastName || ''}`.trim(),
              status: a.status,
              createdAt: a.createdAt
            })),
            contacts: recentContacts
          }
        }
      });
    } catch (error) {
      console.error('Dashboard stats hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Dashboard istatistikleri alınırken hata oluştu'
      });
    }
  }
}

module.exports = new DashboardController();
