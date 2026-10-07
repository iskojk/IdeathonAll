import { useState, useEffect, memo } from 'react'
import { useRouter } from 'next/router'
import { applicationsAPI, teamAPI } from '@/lib/api'
import { transformFormDataToAPI } from '@/utils/validation'
import ErrorMessage from './ErrorMessage'
import Loading from './Loading'
import { toast } from './Toast'
import RulesModal from './RulesModal'
import KvkkModal from './KvkkModal'
import { useIdeathonConfig, useIdeathon } from '@/context/IdeathonContext'

const FOCUS_AREAS = {
  'ideathon-2025': [
    { id: 'siteYonetimi', label: 'Site yönetiminin dijitalleşmesi (aidat/ödeme, bakım/arıza, güvenlik, duyuru vb.)' },
    { id: 'mobilYasam', label: 'Mobil yaşam ve topluluk yönetimi (talep-şikâyet yönetimi, etkinlik/sosyal etkileşim vb.)' },
    { id: 'prediktifBakim', label: 'Prediktif bakım ve saha operasyonları (iş emri yönetimi, varlık yönetimi vb.)' },
    { id: 'enerjiVerimliligi', label: 'Enerji verimliliği ve sürdürülebilirlik (akıllı bina, IoT, sensör/otomasyon vb.)' },
    { id: 'guvenlikYonetimi', label: 'Güvenlik ve erişim yönetimi (kamera ve kartlı geçiş sistemleri, ziyaretçi yönetimi vb.)' },
    { id: 'veriPlatformu', label: 'Veri platformu ve entegrasyonlar (CRM, ERP, bina otomasyonu vb.)' },
  ],
  'ideathon-ankara': [
    { id: 'akilliDegerleme', label: 'Akıllı Değerleme ve Yatırım Analitiği (AI tabanlı değer tahmini & pazar öngörü sistemleri)' },
    { id: 'veriOdakliSatis', label: 'Veri Odaklı Kiralama & Satış Süreçleri (AI ile talep eşleştirme ve dinamik fiyatlama)' },
    { id: 'dijitalTapu', label: 'Dijital Tapu, Hukuk ve Risk Analitiği (RegTech & risk skorlama çözümleri)' },
    { id: 'kentselZeka', label: 'Şehir Ölçeğinde Veri Analitiği & Kentsel Zeka (Urban Data Intelligence)' },
    { id: 'esgSurdurulebilirlik', label: 'ESG, Sürdürülebilirlik ve Karbon Analitiği (Yeşil gayrimenkul için AI çözümleri)' },
    { id: 'aiKullaniciDeneyimi', label: 'AI Destekli Kullanıcı Deneyimi & Yaşam Analitiği (Veriye dayalı konut deneyimi)' },
  ],
  'ideathon-konya': [
    { id: 'asansorTeknolojileri', label: 'Yapay Zekâ Destekli Akıllı Dikey Ulaşım Sistemleri' },
    { id: 'robotikSantiye', label: 'Yeni Nesil Ultra Hızlı ve Manyetik Dikey Ulaşım Teknolojileri' },
    { id: 'akilliBinaMobilite', label: 'IoT ve Dijital İkiz ile Dikey Ulaşım Sistemleri' },
    { id: 'yapisalGuvenlik', label: 'Predictive Maintenance ve Otonom Servis Teknolojileri' },
    { id: 'veriOdakliSantiye', label: 'Akıllı Şantiye ve Robotik Kurulum Teknolojileri' },
    { id: 'surdurulebilirYapi', label: 'Geleceğin Dikey Mobilite Ekosistemi' },
  ],
  'ideathon-izmir': [
    { id: 'enerjiVerimliBina', label: 'Enerji Verimli Bina Teknolojileri (Akıllı yapı tasarımı ve enerji optimizasyonu)' },
    { id: 'yenilenebilirEnerji', label: 'Bina Entegre Yenilenebilir Enerji Sistemleri (Yerinde enerji üretimi ve depolama teknolojileri)' },
    { id: 'elektrikliArac', label: 'Elektrikli Araç Şarj ve Enerji Entegrasyonu (Akıllı şarj altyapısı ve enerji yönetimi)' },
    { id: 'kaynakYonetimi', label: 'Sürdürülebilir Enerji ve Kaynak Yönetimi (Döngüsel kaynak yönetimi platformları)' },
    { id: 'dijitalEnerji', label: 'Dijital Enerji Yönetimi ve Veri Analitiği (IoT ve yapay zekâ destekli enerji platformları)' },
    { id: 'akilliAltyapi', label: 'Akıllı Enerji Altyapıları ve Enerji Paylaşım Sistemleri (Mikro şebeke ve dağıtık enerji ekosistemleri)' },
  ],
  'ideathon-kahramanmaras': [
    { id: 'afetDayanikliYapi', label: 'Afet Dayanıklı Yapı Tasarımı ve İleri Malzeme Teknolojileri (Yüksek dayanım ve güvenli yapı sistemleri)' },
    { id: 'akilliYapiIzleme', label: 'Akıllı Yapı İzleme ve Erken Uyarı Sistemleri (IoT ve sensör tabanlı risk yönetimi)' },
    { id: 'aiAfetRisk', label: 'Yapay Zekâ Destekli Afet Risk Analitiği ve Tahminleme (Veri tabanlı karar destek sistemleri)' },
    { id: 'dijitalSantiye', label: 'Dijital Şantiye ve Güvenli İnşaat Teknolojileri (Afet risklerine karşı akıllı inşaat süreçleri)' },
    { id: 'afetSonrasiMudahale', label: 'Afet Sonrası Hızlı Müdahale ve Geçici Yapı Çözümleri (Esnek ve hızlı kurulabilir yaşam alanları)' },
    { id: 'akilliAfetYonetimi', label: 'Akıllı Afet Yönetimi ve Entegre Kriz Platformları (Uçtan uca afet yönetim sistemleri)' },
  ],
}

const ApplicationForm = memo(function ApplicationForm() {
  const router = useRouter()
  const config = useIdeathonConfig()
  const { slug } = useIdeathon()
  const { edit: editId } = router.query // URL'den edit ID'yi al

  // Bireysel başvuru kapalıysa takım zorunlu
  const forceTeam = !config.loading && config.individualApplicationOpen === false

  const [teamMembers, setTeamMembers] = useState([{ name: '', role: '', tcIdentity: '' }, { name: '', role: '', tcIdentity: '' }])
  const [initialTeamMemberCount, setInitialTeamMemberCount] = useState(0) // Başlangıçtaki üye sayısı
  const [formData, setFormData] = useState({
    // Section 1
    adSoyad: '',
    tcKimlik: '',
    dogumTarihi: '',
    // Section 2
    telefon: '',
    email: '',
    ikametSehir: '',
    linkedinProfil: '',
    // Section 3
    saglikBeyani: '',
    acilDurumKisi: '',
    acilDurumTelefon: '',
    // Section 4
    katilimciTipi: '',
    okul: '',
    bolum: '',
    sinif: '',
    egitimDurumu: '',
    profesyonelBolum: '',
    mezuniyetYili: '',
    takimKatilimi: false,
    takimAdi: '',
    takimUyesiSayisi: '',
    // Section 5
    ilgiAlanlari: [],
    oncekiCalisma: '',
    oncekiCalismaAciklama: '',
    // Section 6
    yetkinlikAlanlari: [],
    digerYetkinlik: '',
    ucKelime: '',
    katilimMotivasyonu: '',
    // Section 7
    projeLink: '',
    tanitimVideo: '',
    // Section 8
    bilgiDogru: false,
    kurallariKabul: false,
    kvkkOnay: false
  })

  const [showStudent, setShowStudent] = useState(false)
  const [showProfessional, setShowProfessional] = useState(false)
  const [showTeam, setShowTeam] = useState(false)
  const [showPreviousWork, setShowPreviousWork] = useState(false)
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [showKvkkModal, setShowKvkkModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [applicationNumber, setApplicationNumber] = useState('')
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoadingApplication, setIsLoadingApplication] = useState(false)
  const [existingApplication, setExistingApplication] = useState(null)

  // Edit mode için başvuruyu yükle
  useEffect(() => {
    const loadApplication = async () => {
      if (editId && router.isReady) {
        // Config yüklendiyse ve düzenleme kapalıysa uyarı ver
        if (!config.loading && !config.applicationEditOpen) {
          setApiError('Başvuru düzenleme süreci şu an kapalıdır. Başvurunuzda değişiklik yapamazsınız.')
          setIsEditMode(false)
          setIsLoadingApplication(false)
          return
        }

        setIsLoadingApplication(true)
        setIsEditMode(true)
        
        try {
          // Tüm başvuruları al ve edit ID ile eşleşeni bul
          const response = await applicationsAPI.getMyApplications()
          
          if (response.success && response.data) {
            const application = response.data.find(app => app._id === editId)
            
            if (application) {
              // Başvuru pending değilse düzenleme izni verme
            if (application.status !== 'pending' && application.status !== 'under_review') {
               setApiError('Sadece beklemedeki veya incelenme aşamasındaki başvurular düzenlenebilir.')
               setIsEditMode(false)
               return
             }
              
              setExistingApplication(application)
              
              // Backend verisini frontend formatına çevir
              const backendToFrontend = transformBackendToFrontend(application)
              setFormData(backendToFrontend)
              
              // Conditional fields'ı göster
              if (backendToFrontend.katilimciTipi === 'ogrenci') {
                setShowStudent(true)
              } else if (['girişimci', 'calisan', 'yeniMezun'].includes(backendToFrontend.katilimciTipi)) {
                setShowProfessional(true)
              }
              
              if (backendToFrontend.takimKatilimi) {
                setShowTeam(true)
                // Takım üyelerini teamMembers state'ine yükle
                const applicationTeamInfo = application.teamInfo
                if (applicationTeamInfo?.teamMembers && applicationTeamInfo.teamMembers.length > 0) {
                  const loadedMembers = applicationTeamInfo.teamMembers.map(member => ({
                    name: member.name || '',
                    role: member.role || '',
                    tcIdentity: member.tcIdentity || ''
                  }))
                  setTeamMembers(loadedMembers)
                  // Başlangıçtaki üye sayısını kaydet
                  setInitialTeamMemberCount(loadedMembers.length)
                } else {
                  // Eski formData'dan takım üyelerini parse et (fallback)
                  const takimUyeleriText = application.formData?.takimUyeleri || ''
                  if (takimUyeleriText) {
                    const parsedMembers = takimUyeleriText.split('\n').filter(line => line.trim()).map(line => {
                      const [name, role] = line.split('-').map(s => s.trim())
                      return { name: name || '', role: role || 'Üye', tcIdentity: '' }
                    })
                    setTeamMembers(parsedMembers.length > 0 ? parsedMembers : [{ name: '', role: '', tcIdentity: '' }])
                  }
                }
              }
              
              if (backendToFrontend.oncekiCalisma === 'evet') {
                setShowPreviousWork(true)
              }
            } else {
              setApiError('Başvuru bulunamadı.')
              setIsEditMode(false)
            }
          }
        } catch (error) {
          console.error('Load application error:', error)
          // 401 hatası durumunda otomatik olarak login'e yönlendirilecek (api.js'de handle ediliyor)
          // Diğer hataları göster
          if (error.status !== 401) {
            setApiError('Başvuru yüklenirken bir hata oluştu.')
            setIsEditMode(false)
          }
        } finally {
          setIsLoadingApplication(false)
        }
      }
    }
    
    loadApplication()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, router.isReady, config.loading, config.applicationEditOpen])

  // Önceki başvurudan kişisel bilgileri ön doldur (sadece yeni başvuruda)
  useEffect(() => {
    const prefillFromPrevious = async () => {
      if (editId || isEditMode) return
      if (!router.isReady) return

      try {
        const res = await applicationsAPI.getPrefill()
        if (res.success && res.hasPreviousApplication && res.data) {
          const { personalInfo, socialInfo } = res.data
          setFormData(prev => ({
            ...prev,
            adSoyad: `${personalInfo?.firstName || ''} ${personalInfo?.lastName || ''}`.trim() || prev.adSoyad,
            tcKimlik: personalInfo?.tcIdentity || prev.tcKimlik,
            dogumTarihi: personalInfo?.birthDate ? personalInfo.birthDate.split('T')[0] : prev.dogumTarihi,
            telefon: personalInfo?.phone || prev.telefon,
            email: personalInfo?.email || prev.email,
            ikametSehir: personalInfo?.city || prev.ikametSehir,
            linkedinProfil: socialInfo?.linkedinProfile || prev.linkedinProfil,
          }))
        }
      } catch (err) {
        // Prefill yapılamazsa sessizce devam et
      }
    }

    prefillFromPrevious()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, editId])

  // Yeni başvuruda mevcut takım varsa otomatik doldur
  useEffect(() => {
    const prefillTeam = async () => {
      // Sadece yeni başvurularda ve edit modda değilken çalış
      if (editId || isEditMode) return
      if (!router.isReady) return

      try {
        const teamRes = await teamAPI.getMyTeam()
        if (teamRes.success && teamRes.data?.team) {
          const team = teamRes.data.team
          // Takım varsa formu ön doldur
          setFormData(prev => ({
            ...prev,
            takimKatilimi: true,
            takimAdi: team.teamName || '',
            takimUyesiSayisi: (team.members?.length || 0).toString()
          }))
          setShowTeam(true)

          if (team.members && team.members.length > 0) {
            const prefillMembers = team.members.map(m => ({
              name: m.name || '',
              tcIdentity: m.tcIdentity || '',
              role: m.role || ''
            }))
            setTeamMembers(prefillMembers)
            setInitialTeamMemberCount(prefillMembers.length)
          }
        }
      } catch (err) {
        // silent catch
      }
    }

    prefillTeam()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, editId])

  // Bireysel başvuru kapalıysa takımı zorla aç
  useEffect(() => {
    if (forceTeam && !isEditMode) {
      setFormData(prev => ({ ...prev, takimKatilimi: true }))
      setShowTeam(true)
    }
  }, [forceTeam, isEditMode])

  // Takım üye sayısı değiştiğinde otomatik güncelle
  useEffect(() => {
    if (showTeam) {
      const validMembers = teamMembers.filter(member => member.name.trim()).length
      setFormData(prev => ({
        ...prev,
        takimUyesiSayisi: validMembers.toString()
      }))
    }
  }, [teamMembers, showTeam])

  // Backend verisini frontend formatına çevir
  const transformBackendToFrontend = (application) => {
    const { personalInfo, profileInfo, socialInfo, healthInfo, teamInfo, interestsInfo, competenciesInfo, additionalInfo, consents, formData: backendFormData } = application
    
    // Participant type mapping (backend -> frontend)
    const participantTypeMap = {
      'student': 'ogrenci',
      'entrepreneur': 'girişimci',
      'employee': 'calisan',
      'recent_graduate': 'yeniMezun',
      'other': 'diger'
    }
    
    // Education level mapping (backend -> frontend)
    const educationLevelMap = {
      'bachelor': 'lisans',
      'master': 'yuksekLisans',
      'phd': 'doktora'
    }
    
    // Observation field mapping (backend -> frontend)
    const observationFieldMap = {
      'site_management': 'siteYonetimi',
      'mobile_living': 'mobilYasam',
      'predictive_maintenance': 'prediktifBakim',
      'energy_efficiency': 'enerjiVerimliligi',
      'security_access': 'guvenlikYonetimi',
      'data_platform': 'veriPlatformu',
      'smart_valuation': 'akilliDegerleme',
      'data_driven_sales': 'veriOdakliSatis',
      'digital_title_deed': 'dijitalTapu',
      'urban_intelligence': 'kentselZeka',
      'esg_sustainability': 'esgSurdurulebilirlik',
      'ai_user_experience': 'aiKullaniciDeneyimi',
      'elevator_technologies': 'asansorTeknolojileri',
      'robotic_construction': 'robotikSantiye',
      'smart_building_mobility': 'akilliBinaMobilite',
      'structural_safety_monitoring': 'yapisalGuvenlik',
      'data_driven_construction': 'veriOdakliSantiye',
      'sustainable_modular_construction': 'surdurulebilirYapi',
      'energy_efficient_buildings': 'enerjiVerimliBina',
      'renewable_energy_systems': 'yenilenebilirEnerji',
      'ev_charging_integration': 'elektrikliArac',
      'sustainable_resource_management': 'kaynakYonetimi',
      'digital_energy_management': 'dijitalEnerji',
      'smart_energy_infrastructure': 'akilliAltyapi',
    }
    
    // Competencies mapping (backend -> frontend)
    const competenciesMap = {
      'problem_analysis': 'problemAnalizi',
      'creative_solutions': 'yenilikciCozum',
      'user_experience': 'kullaniciDeneyimi',
      'presentation': 'sunumHikaye',
      'technical_development': 'teknikGelistirme',
      'social_impact': 'sosyalEtki'
    }
    
    return {
      // Section 1
      adSoyad: `${personalInfo?.firstName || ''} ${personalInfo?.lastName || ''}`.trim(),
      tcKimlik: personalInfo?.tcIdentity || '',
      dogumTarihi: personalInfo?.birthDate && typeof personalInfo.birthDate === 'string' ? personalInfo.birthDate.split('T')[0] : '',
      // Section 2
      telefon: personalInfo?.phone || '',
      email: personalInfo?.email || '',
      ikametSehir: personalInfo?.city || '',
      linkedinProfil: socialInfo?.linkedinProfile || '',
      // Section 3
      saglikBeyani: healthInfo?.healthDeclaration || '',
      acilDurumKisi: healthInfo?.emergencyContact?.name || '',
      acilDurumTelefon: healthInfo?.emergencyContact?.phone || '',
      // Section 4
      katilimciTipi: participantTypeMap[profileInfo?.participantType] || '',
      okul: profileInfo?.studentInfo?.school || '',
      bolum: profileInfo?.studentInfo?.department || '',
      sinif: profileInfo?.studentInfo?.grade || '',
      egitimDurumu: educationLevelMap[profileInfo?.professionalInfo?.educationLevel] || '',
      profesyonelBolum: profileInfo?.professionalInfo?.field || '',
      mezuniyetYili: profileInfo?.professionalInfo?.graduationYear?.toString() || '',
      takimKatilimi: teamInfo?.isInTeam || false,
      takimAdi: teamInfo?.teamName || '',
      takimUyesiSayisi: teamInfo?.teamSize?.toString() || '',
      // Section 5
      ilgiAlanlari: Array.isArray(interestsInfo?.observationField) ? interestsInfo.observationField : [],
      oncekiCalisma: interestsInfo?.hasPreviousExperience ? 'evet' : 'hayir',
      oncekiCalismaAciklama: interestsInfo?.previousExperienceDescription || '',
      // Section 6
      yetkinlikAlanlari: competenciesInfo?.competencies?.map(c => competenciesMap[c]).filter(Boolean) || [],
      digerYetkinlik: competenciesInfo?.otherCompetency || '',
      ucKelime: competenciesInfo?.selfDescription || '',
      katilimMotivasyonu: competenciesInfo?.motivation || '',
      // Section 7
      projeLink: additionalInfo?.projectLink || '',
      tanitimVideo: additionalInfo?.videoLink || '',
      // Section 8
      bilgiDogru: consents?.informationAccuracy || false,
      kurallariKabul: consents?.rulesCompliance || false,
      kvkkOnay: consents?.kvkkConsent || false
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (type === 'checkbox') {
      if (name === 'yetkinlikAlanlari[]') {
        setFormData(prev => ({
          ...prev,
          yetkinlikAlanlari: checked
            ? [...prev.yetkinlikAlanlari, value]
            : prev.yetkinlikAlanlari.filter(item => item !== value)
        }))
      } else if (name === 'ilgiAlanlari[]') {
        setFormData(prev => ({
          ...prev,
          ilgiAlanlari: checked
            ? [...prev.ilgiAlanlari, value]
            : prev.ilgiAlanlari.filter(item => item !== value)
        }))
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Clear error when user starts typing
    const errorKey = name.replace('[]', '')
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }))
    }
    if (apiError) {
      setApiError('')
    }

    if (name === 'tcKimlik' && value.trim() && showTeam) {
      teamMembers.forEach((member, index) => {
        if (member.tcIdentity.trim() && member.tcIdentity.trim() === value.trim()) {
          toast.error('Takım üyelerinden birinin TC Kimlik No\'su sizinkiyle aynı. Kendinizi takım üyesi olarak ekleyemezsiniz.')
          setErrors(prev => ({ ...prev, [`teamMember_${index}_tcIdentity`]: 'Bu TC Kimlik No başvuru sahibine aittir. Kendinizi takım üyesi olarak ekleyemezsiniz.' }))
        }
      })
    }
  }

  const handleRulesAccept = () => {
    setFormData(prev => ({ ...prev, kurallariKabul: true }))
    if (errors.kurallariKabul) {
      setErrors(prev => ({ ...prev, kurallariKabul: '' }))
    }
  }

  const handleKvkkAccept = () => {
    setFormData(prev => ({ ...prev, kvkkOnay: true }))
    if (errors.kvkkOnay) {
      setErrors(prev => ({ ...prev, kvkkOnay: '' }))
    }
  }

  const handleParticipantTypeChange = (e) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, katilimciTipi: value }))
    
    if (value === 'ogrenci') {
      setShowStudent(true)
      setShowProfessional(false)
    } else if (['girişimci', 'calisan', 'yeniMezun'].includes(value)) {
      setShowStudent(false)
      setShowProfessional(true)
    } else {
      setShowStudent(false)
      setShowProfessional(false)
    }
  }

  const handleTeamChange = (e) => {
    const checked = e.target.checked
    setFormData(prev => ({ ...prev, takimKatilimi: checked }))
    setShowTeam(checked)

    if (checked) {
      setTeamMembers([
        { name: '', role: '', tcIdentity: '' },
        { name: '', role: '', tcIdentity: '' }
      ])
      if (!isEditMode) {
        setInitialTeamMemberCount(0)
      }
    } else {
      setTeamMembers([{ name: '', role: '', tcIdentity: '' }])
      setInitialTeamMemberCount(0)
    }
  }

  const handleTeamMemberChange = (index, field, value) => {
    const updatedMembers = [...teamMembers]
    updatedMembers[index][field] = value
    setTeamMembers(updatedMembers)

    if (field === 'tcIdentity' && value.trim() && formData.tcKimlik.trim()) {
      if (value.trim() === formData.tcKimlik.trim()) {
        toast.error('Kendinizi takım üyesi olarak ekleyemezsiniz. Siz zaten takım lideri olarak kayıtlısınız.')
        setErrors(prev => ({ ...prev, [`teamMember_${index}_tcIdentity`]: 'Bu TC Kimlik No başvuru sahibine aittir. Kendinizi takım üyesi olarak ekleyemezsiniz.' }))
      } else if (errors[`teamMember_${index}_tcIdentity`]?.includes('başvuru sahibine')) {
        setErrors(prev => ({ ...prev, [`teamMember_${index}_tcIdentity`]: '' }))
      }
    }
  }

  const addTeamMember = () => {
    const maxMembers = 4 // + başvurucu = 5 kişi toplam
    if (teamMembers.length >= maxMembers) {
      toast.error('Kendiniz dahil en fazla 5 kişilik takım oluşturabilirsiniz (en fazla 4 takım üyesi).')
      return
    }
    setTeamMembers([...teamMembers, { name: '', role: '', tcIdentity: '' }])
  }

  const removeTeamMember = (index) => {
    if (teamMembers.length > 2) {
      const updatedMembers = teamMembers.filter((_, i) => i !== index)
      setTeamMembers(updatedMembers)
    } else {
      toast.error('Kendiniz dahil en az 3 kişilik takım gereklidir. Minimum 2 takım üyesi olmalıdır.')
    }
  }

  const handlePreviousWorkChange = (e) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, oncekiCalisma: value }))
    setShowPreviousWork(value === 'evet')
  }

  const formatPhone = (value) => {
    let digits = value.replace(/\D/g, '')
    if (digits.length > 0 && !digits.startsWith('0')) {
      digits = '0' + digits
    }
    if (digits.length > 11) {
      digits = digits.substring(0, 11)
    }
    let formatted = digits
    if (digits.length > 4) {
      formatted = digits.substring(0, 4) + ' ' + digits.substring(4)
    }
    if (digits.length > 7) {
      formatted = digits.substring(0, 4) + ' ' + digits.substring(4, 7) + ' ' + digits.substring(7)
    }
    return formatted
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value)
    setFormData(prev => ({ ...prev, [e.target.name]: formatted }))
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    
    const newErrors = {}
    
    // Basic validation
    if (!formData.adSoyad.trim()) newErrors.adSoyad = 'Bu alan zorunludur'
    if (!formData.tcKimlik.trim()) newErrors.tcKimlik = 'Bu alan zorunludur'
    else if (!/^[0-9]{11}$/.test(formData.tcKimlik)) newErrors.tcKimlik = 'TC Kimlik No 11 rakam olmalıdır'
    if (!formData.dogumTarihi) newErrors.dogumTarihi = 'Bu alan zorunludur'
    if (!formData.telefon.trim()) newErrors.telefon = 'Bu alan zorunludur'
    if (!formData.email.trim()) {
      newErrors.email = 'Bu alan zorunludur'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz'
    }
    if (!formData.ikametSehir.trim()) newErrors.ikametSehir = 'Bu alan zorunludur'
    if (!formData.katilimciTipi) newErrors.katilimciTipi = 'Katılımcı tipi seçmelisiniz'
    
    // Conditional validations
    if (showStudent) {
      if (!formData.okul.trim()) newErrors.okul = 'Bu alan zorunludur'
      if (!formData.bolum.trim()) newErrors.bolum = 'Bu alan zorunludur'
      if (!formData.sinif.trim()) newErrors.sinif = 'Bu alan zorunludur'
    }
    if (showProfessional) {
      if (!formData.egitimDurumu) newErrors.egitimDurumu = 'Bu alan zorunludur'
      if (!formData.profesyonelBolum.trim()) newErrors.profesyonelBolum = 'Bu alan zorunludur'
      if (!formData.mezuniyetYili) newErrors.mezuniyetYili = 'Bu alan zorunludur'
    }
    if (showTeam) {
      if (!formData.takimAdi.trim()) newErrors.takimAdi = 'Bu alan zorunludur'
      const validMemberCount = teamMembers.filter(member => member.name.trim()).length
      
      // Min 2 üye (+ başvurucu = 3 kişi), Max 4 üye (+ başvurucu = 5 kişi)
      if (validMemberCount < 2) {
        newErrors.teamMembers = 'Kendiniz dahil en az 3 kişilik takım oluşturmalısınız. Lütfen en az 2 takım üyesi ekleyiniz.'
      } else if (validMemberCount > 4) {
        newErrors.takimUyesiSayisi = 'Kendiniz dahil en fazla 5 kişilik takım oluşturabilirsiniz (en fazla 4 takım üyesi).'
      }
      // Her üyenin adı ve TC kimlik dolu olmalı (sadece dolu üyeler için)
      teamMembers.forEach((member, index) => {
        if (member.name.trim()) {
          if (!member.tcIdentity.trim()) {
            newErrors[`teamMember_${index}_tcIdentity`] = `${index + 1}. üyenin TC kimlik numarası zorunludur`
          } else if (!/^[0-9]{11}$/.test(member.tcIdentity)) {
            newErrors[`teamMember_${index}_tcIdentity`] = `${index + 1}. üyenin TC kimlik numarası 11 rakam olmalıdır`
          } else if (formData.tcKimlik.trim() && member.tcIdentity.trim() === formData.tcKimlik.trim()) {
            newErrors[`teamMember_${index}_tcIdentity`] = 'Kendinizi takım üyesi olarak ekleyemezsiniz. Siz zaten takım lideri olarak kayıtlısınız.'
          }
        }
      })
    }
    
    if (formData.ilgiAlanlari.length === 0) newErrors.ilgiAlanlari = 'En az bir ilgi alanı seçmelisiniz'
    if (formData.yetkinlikAlanlari.length === 0) newErrors.yetkinlikAlanlari = 'En az bir yetkinlik alanı seçmelisiniz'
    if (!formData.katilimMotivasyonu.trim()) newErrors.katilimMotivasyonu = 'Bu alan zorunludur'
    if (!formData.bilgiDogru) newErrors.bilgiDogru = 'Bu alanı onaylamalısınız'
    if (!formData.kurallariKabul) newErrors.kurallariKabul = 'Bu alanı onaylamalısınız'
    if (!formData.kvkkOnay) newErrors.kvkkOnay = 'Bu alanı onaylamalısınız'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // Scroll to first error
      const firstErrorElement = document.querySelector('.error-field')
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    if (!slug) {
      setApiError('Lütfen önce bir Ideathon programı seçin. Ana sayfaya dönüp bir Ideathon seçebilirsiniz.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setIsSubmitting(true)
    
    try {
      // Transform form data to API format
      const filteredTeamMembers = teamMembers.filter(member => member.name.trim())


      const apiPayload = transformFormDataToAPI({
        ...formData,
        teamMembers: filteredTeamMembers // Sadece dolu üyeleri gönder
      })


      let response

      if (isEditMode && editId) {
        // Edit mode - güncelleme yap
        response = await applicationsAPI.updateMyApplication(editId, apiPayload)
      } else {
        // Create mode - yeni başvuru
        response = await applicationsAPI.create(apiPayload)
      }
      
      if (response.success) {
        if (isEditMode) {
          // Edit mode başarılı - başvurular sayfasına yönlendir
          toast.success('Başvurunuz başarıyla güncellendi! ✨');
          router.push('/basvurularim')
        } else {
          // Create mode başarılı - success modal göster
          setApplicationNumber(response.data.applicationNumber)
          setShowSuccess(true)
          toast.success('🎉 Başvurunuz başarıyla alındı!');
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      } else {
        setApiError(response.message || `Başvuru ${isEditMode ? 'güncellenirken' : 'gönderilirken'} bir hata oluştu`)
        toast.error(response.message || `Başvuru ${isEditMode ? 'güncellenirken' : 'gönderilirken'} bir hata oluştu`);
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (error) {
      console.error('Application submission error:', error)
      // 401 hatası durumunda otomatik olarak login'e yönlendirilecek (api.js'de handle ediliyor)
      // Diğer hataları göster
      if (error.status !== 401) {
        const errorMsg = error.message || `Başvuru ${isEditMode ? 'güncellenirken' : 'gönderilirken'} bir hata oluştu. Lütfen tekrar deneyiniz.`
        setApiError(errorMsg)
        toast.error(errorMsg);
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeSuccessModal = () => {
    setShowSuccess(false)
    // Redirect to applications page
    router.push('/basvurularim')
  }

  // Loading state göster
  if (isLoadingApplication) {
    return <Loading fullScreen message="Başvuru yükleniyor..." />
  }

  return (
    <>
      <section className="application-form-section py-100px md-py-80px sm-py-60px" style={{ marginTop: '140px' }}>
        <div className="container">
          {/* Form Header */}
          <div className="row justify-content-center mb-60px">
            <div className="col-lg-10 col-md-12 text-center">
              <div className="inline-block mb-30px">
                <span className="ps-25px pe-25px pt-8px pb-8px text-uppercase alt-font text-primary-blue fs-13 lh-28 fw-600 border-radius-100px bg-primary-blue-light d-inline-flex align-items-center">
                  <i className={`bi ${isEditMode ? 'bi-pencil-square' : 'bi-file-earmark-text'} fs-20 me-10px`}></i>
                 
                </span>
              </div>
              <h1 className="alt-font text-dark-gray fw-700 mb-20px lh-52 md-lh-44 sm-lh-40">
                {config.name || 'Emlak Konut Ideathon'} <br />
                <span className="text-primary-blue">
                  {isEditMode ? 'Başvurunuzu Düzenleyin' : 'Başvuru Formu'}
                </span>
              </h1>
              {!isEditMode && config.shortName && (
                <div className="ideathon-badge-wrapper mb-15px">
                  <span className="ideathon-badge">
                    <i className="bi bi-geo-alt-fill me-2"></i>
                    {config.shortName} için başvuru yapıyorsunuz
                  </span>
                </div>
              )}
              {isEditMode && existingApplication && (
                <p className="text-dark-gray lh-28 fs-16 mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Başvuru No: <strong>{existingApplication.applicationNumber}</strong>
                </p>
              )}
            </div>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="row justify-content-center mb-30px">
              <div className="col-lg-10 col-md-12">
                <ErrorMessage 
                  message={apiError} 
                  onClose={() => setApiError('')}
                  type="error"
                />
              </div>
            </div>
          )}

          {/* Application Form */}
          <div className="row justify-content-center">
            <div className="col-lg-10 col-md-12">
              <form onSubmit={handleSubmit} className="application-form bg-white border-radius-20px box-shadow-large p-50px md-p-40px sm-p-10px">

                {/* Section 1: Kişisel Bilgiler */}
                <div className="form-section mb-50px">
                  <div className="section-header mb-30px">
                    <div className="section-number">1</div>
                    <h3 className="section-title alt-font text-dark-gray fw-600 fs-24">Kişisel Bilgiler</h3>
                  </div>
                  <div className="row g-30px">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="adSoyad" className="form-label text-dark-gray fw-500 mb-10px">Ad Soyad <span className="text-red">*</span></label>
                        <input
                          type="text"
                          id="adSoyad"
                          name="adSoyad"
                          className={`form-control border-radius-8px ${errors.adSoyad ? 'error-field' : ''}`}
                          placeholder="Adınızı ve soyadınızı giriniz"
                          value={formData.adSoyad}
                          onChange={handleChange}
                          required
                        />
                        {errors.adSoyad && <div className="field-error">{errors.adSoyad}</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="tcKimlik" className="form-label text-dark-gray fw-500 mb-10px">T.C. Kimlik No <span className="text-red">*</span></label>
                        <input
                          type="text"
                          id="tcKimlik"
                          name="tcKimlik"
                          className={`form-control border-radius-8px ${errors.tcKimlik ? 'error-field' : ''}`}
                          placeholder="11 haneli T.C. Kimlik numaranızı giriniz"
                          maxLength="11"
                          value={formData.tcKimlik}
                          onChange={handleChange}
                          required
                        />
                        {errors.tcKimlik && <div className="field-error">{errors.tcKimlik}</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="dogumTarihi" className="form-label text-dark-gray fw-500 mb-10px">Doğum Tarihi (Gün/Ay/Yıl) <span className="text-red">*</span></label>
                        <input
                          type="date"
                          id="dogumTarihi"
                          name="dogumTarihi"
                          className={`form-control border-radius-8px ${errors.dogumTarihi ? 'error-field' : ''}`}
                          value={formData.dogumTarihi}
                          onChange={handleChange}
                          required
                        />
                        {errors.dogumTarihi && <div className="field-error">{errors.dogumTarihi}</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: İletişim Bilgileri */}
                <div className="form-section mb-50px">
                  <div className="section-header mb-30px">
                    <div className="section-number">2</div>
                    <h3 className="section-title alt-font text-dark-gray fw-600 fs-24">İletişim Bilgileri</h3>
                  </div>
                  <div className="row g-30px">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="telefon" className="form-label text-dark-gray fw-500 mb-10px">Telefon <span className="text-red">*</span></label>
                        <input
                          type="tel"
                          id="telefon"
                          name="telefon"
                          className={`form-control border-radius-8px ${errors.telefon ? 'error-field' : ''}`}
                          placeholder="05XX XXX XX XX"
                          value={formData.telefon}
                          onChange={handlePhoneChange}
                          required
                        />
                        {errors.telefon && <div className="field-error">{errors.telefon}</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="email" className="form-label text-dark-gray fw-500 mb-10px">E-posta <span className="text-red">*</span></label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className={`form-control border-radius-8px ${errors.email ? 'error-field' : ''}`}
                          placeholder="ornek@email.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                        {errors.email && <div className="field-error">{errors.email}</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="ikametSehir" className="form-label text-dark-gray fw-500 mb-10px">İkamet Şehri <span className="text-red">*</span></label>
                        <input
                          type="text"
                          id="ikametSehir"
                          name="ikametSehir"
                          className={`form-control border-radius-8px ${errors.ikametSehir ? 'error-field' : ''}`}
                          placeholder="İkamet ettiğiniz şehri giriniz"
                          value={formData.ikametSehir}
                          onChange={handleChange}
                          required
                        />
                        {errors.ikametSehir && <div className="field-error">{errors.ikametSehir}</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="linkedinProfil" className="form-label text-dark-gray fw-500 mb-10px">LinkedIn / Kişisel Profil (varsa)</label>
                        <input
                          type="url"
                          id="linkedinProfil"
                          name="linkedinProfil"
                          className="form-control border-radius-8px"
                          placeholder="https://linkedin.com/in/kullanici-adi"
                          value={formData.linkedinProfil}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Sağlık ve Acil Durum Bilgileri */}
                <div className="form-section mb-50px">
                  <div className="section-header mb-30px">
                    <div className="section-number">3</div>
                    <h3 className="section-title alt-font text-dark-gray fw-600 fs-24">Sağlık ve Acil Durum Bilgileri</h3>
                  </div>
                  <div className="row g-30px">
                    <div className="col-12">
                      <div className="form-group">
                        <label htmlFor="saglikBeyani" className="form-label text-dark-gray fw-500 mb-10px">Sağlık Durumu Beyanı (Hastalık, Alerji, Özel İhtiyaç)</label>
                        <textarea
                          id="saglikBeyani"
                          name="saglikBeyani"
                          className="form-control border-radius-8px"
                          rows="3"
                          placeholder="Sağlık durumunuzla ilgili önemli bilgiler varsa belirtiniz"
                          value={formData.saglikBeyani}
                          onChange={handleChange}
                        ></textarea>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="acilDurumKisi" className="form-label text-dark-gray fw-500 mb-10px">Acil Durumda Aranacak Kişi</label>
                        <input
                          type="text"
                          id="acilDurumKisi"
                          name="acilDurumKisi"
                          className="form-control border-radius-8px"
                          placeholder="Ad Soyad"
                          value={formData.acilDurumKisi}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="acilDurumTelefon" className="form-label text-dark-gray fw-500 mb-10px">Telefon Numarası</label>
                        <input
                          type="tel"
                          id="acilDurumTelefon"
                          name="acilDurumTelefon"
                          className="form-control border-radius-8px"
                          placeholder="05XX XXX XX XX"
                          value={formData.acilDurumTelefon}
                          onChange={handlePhoneChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Katılımcı Profili */}
                <div className="form-section mb-50px">
                  <div className="section-header mb-30px">
                    <div className="section-number">4</div>
                    <h3 className="section-title alt-font text-dark-gray fw-600 fs-24">Katılımcı Profili</h3>
                  </div>

                  <div className="participant-type-selection mb-40px">
                    <div className="radio-group">
                      <div className="radio-option">
                        <input type="radio" id="ogrenci" name="katilimciTipi" value="ogrenci" className="radio-input" checked={formData.katilimciTipi === 'ogrenci'} onChange={handleParticipantTypeChange} />
                        <label htmlFor="ogrenci" className="radio-label">Öğrenci</label>
                      </div>
                      <div className="radio-option">
                        <input type="radio" id="girişimci" name="katilimciTipi" value="girişimci" className="radio-input" checked={formData.katilimciTipi === 'girişimci'} onChange={handleParticipantTypeChange} />
                        <label htmlFor="girişimci" className="radio-label">Girişimci</label>
                      </div>
                      <div className="radio-option">
                        <input type="radio" id="calisan" name="katilimciTipi" value="calisan" className="radio-input" checked={formData.katilimciTipi === 'calisan'} onChange={handleParticipantTypeChange} />
                        <label htmlFor="calisan" className="radio-label">Çalışan</label>
                      </div>
                      <div className="radio-option">
                        <input type="radio" id="yeniMezun" name="katilimciTipi" value="yeniMezun" className="radio-input" checked={formData.katilimciTipi === 'yeniMezun'} onChange={handleParticipantTypeChange} />
                        <label htmlFor="yeniMezun" className="radio-label">Yeni Mezun</label>
                      </div>
                    </div>
                  </div>

                  {/* Öğrenci Section */}
                  {showStudent && (
                    <div className="participant-details mb-40px">
                      <h4 className="subsection-title alt-font text-dark-gray fw-600 mb-20px">Öğrenci Bilgileri</h4>
                      <div className="row g-30px">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="okul" className="form-label text-dark-gray fw-500 mb-10px">Okul <span className="text-red">*</span></label>
                            <input
                              type="text"
                              id="okul"
                              name="okul"
                              className={`form-control border-radius-8px ${errors.okul ? 'error-field' : ''}`}
                              placeholder="Üniversite/Okul adı"
                              value={formData.okul}
                              onChange={handleChange}
                              required={showStudent}
                            />
                            {errors.okul && <div className="field-error">{errors.okul}</div>}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label htmlFor="bolum" className="form-label text-dark-gray fw-500 mb-10px">Bölüm <span className="text-red">*</span></label>
                            <input
                              type="text"
                              id="bolum"
                              name="bolum"
                              className={`form-control border-radius-8px ${errors.bolum ? 'error-field' : ''}`}
                              placeholder="Bölüm adı"
                              value={formData.bolum}
                              onChange={handleChange}
                              required={showStudent}
                            />
                            {errors.bolum && <div className="field-error">{errors.bolum}</div>}
                          </div>
                        </div>
                        <div className="col-md-2">
                          <div className="form-group">
                            <label htmlFor="sinif" className="form-label text-dark-gray fw-500 mb-10px">Sınıf <span className="text-red">*</span></label>
                            <input
                              type="text"
                              id="sinif"
                              name="sinif"
                              className={`form-control border-radius-8px ${errors.sinif ? 'error-field' : ''}`}
                              placeholder="örn: 3"
                              value={formData.sinif}
                              onChange={handleChange}
                              required={showStudent}
                            />
                            {errors.sinif && <div className="field-error">{errors.sinif}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profesyonel Section */}
                  {showProfessional && (
                    <div className="participant-details mb-40px">
                      <h4 className="subsection-title alt-font text-dark-gray fw-600 mb-20px">Profesyonel Bilgileri</h4>
                      <div className="row g-30px">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="egitimDurumu" className="form-label text-dark-gray fw-500 mb-10px">Eğitim Durumu <span className="text-red">*</span></label>
                            <select
                              id="egitimDurumu"
                              name="egitimDurumu"
                              className={`form-control border-radius-8px ${errors.egitimDurumu ? 'error-field' : ''}`}
                              value={formData.egitimDurumu}
                              onChange={handleChange}
                              required={showProfessional}
                            >
                              <option value="">Seçiniz</option>
                              <option value="lisans">Lisans</option>
                              <option value="yuksekLisans">Yüksek Lisans</option>
                              <option value="doktora">Doktora</option>
                            </select>
                            {errors.egitimDurumu && <div className="field-error">{errors.egitimDurumu}</div>}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="profesyonelBolum" className="form-label text-dark-gray fw-500 mb-10px">Bölüm / Alan <span className="text-red">*</span></label>
                            <input
                              type="text"
                              id="profesyonelBolum"
                              name="profesyonelBolum"
                              className={`form-control border-radius-8px ${errors.profesyonelBolum ? 'error-field' : ''}`}
                              placeholder="Bölüm veya uzmanlık alanı"
                              value={formData.profesyonelBolum}
                              onChange={handleChange}
                              required={showProfessional}
                            />
                            {errors.profesyonelBolum && <div className="field-error">{errors.profesyonelBolum}</div>}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="mezuniyetYili" className="form-label text-dark-gray fw-500 mb-10px">Mezuniyet Yılı <span className="text-red">*</span></label>
                            <input
                              type="number"
                              id="mezuniyetYili"
                              name="mezuniyetYili"
                              className={`form-control border-radius-8px ${errors.mezuniyetYili ? 'error-field' : ''}`}
                              placeholder="örn: 2020"
                              min="1950"
                              max="2030"
                              value={formData.mezuniyetYili}
                              onChange={handleChange}
                              required={showProfessional}
                            />
                            {errors.mezuniyetYili && <div className="field-error">{errors.mezuniyetYili}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Takım Section */}
                  {forceTeam ? (
                    <div className="team-required-notice mb-30px">
                      <div className="alert border-radius-8px p-15px" style={{
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        border: '2px solid #2563eb'
                      }}>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-people-fill me-10px fs-20" style={{ color: '#2563eb' }}></i>
                          <div style={{ color: '#1e3a5f' }}>
                            <strong>Takım Başvurusu Zorunludur</strong>
                            <span className="d-block mt-2px" style={{ fontSize: '13px' }}>
                              Bu ideathon için bireysel başvuru kabul edilmemektedir. Lütfen takım bilgilerinizi doldurun.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="checkbox-wrapper mb-30px">
                      <input type="checkbox" id="takimKatilimi" name="takimKatilimi" className="checkbox-input-enhanced" onChange={handleTeamChange} checked={formData.takimKatilimi} />
                      <div className="checkbox-display" onClick={() => document.getElementById('takimKatilimi').click()}></div>
                      <label htmlFor="takimKatilimi" className="checkbox-label-enhanced">Takım olarak katılacak mısınız?</label>
                    </div>
                  )}

                  {showTeam && (
                    <div className="participant-details mb-40px">
                      <h4 className="subsection-title alt-font text-dark-gray fw-600 mb-20px">Takım Bilgileri</h4>
                      <div className="row g-30px">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="takimAdi" className="form-label text-dark-gray fw-500 mb-10px">Takım Adı <span className="text-red">*</span></label>
                            <input
                              type="text"
                              id="takimAdi"
                              name="takimAdi"
                              className={`form-control border-radius-8px ${errors.takimAdi ? 'error-field' : ''}`}
                              placeholder="Takımınızın adı"
                              value={formData.takimAdi}
                              onChange={handleChange}
                              required={showTeam}
                            />
                            {errors.takimAdi && <div className="field-error">{errors.takimAdi}</div>}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="takimUyesiSayisi" className="form-label text-dark-gray fw-500 mb-10px">Takım Üye Sayısı <span className="text-red">*</span></label>
                            <input
                              type="number"
                              id="takimUyesiSayisi"
                              name="takimUyesiSayisi"
                              className={`form-control border-radius-8px ${errors.takimUyesiSayisi ? 'error-field' : ''}`}
                              placeholder="Otomatik hesaplanır"
                              min="1"
                              max="10"
                              value={formData.takimUyesiSayisi}
                              readOnly
                              required={showTeam}
                            />
                            {errors.takimUyesiSayisi && <div className="field-error">{errors.takimUyesiSayisi}</div>}
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="form-group">
                            <div className="d-flex align-items-center justify-content-between mb-20px">
                              <label className="form-label text-dark-gray fw-600 mb-0 fs-18">
                                <i className="bi bi-people-fill text-primary-blue me-10px fs-20"></i>
                                Takım Üyeleri <span className="text-red">*</span>
                              </label>
                              <div className="team-count-badge">
                                <span className="badge bg-primary-blue text-white px-12px py-6px border-radius-20px fw-500">
                                  {teamMembers.filter(m => m.name.trim()).length} Üye
                                </span>
                              </div>
                            </div>

                            {/* Team Members Note */}
                            <div className="team-members-note mb-20px">
                              {/* Takım Limiti Notu */}
                              <div className="alert border-radius-8px p-15px mb-15px" style={{ 
                                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                border: '2px solid #2563eb'
                              }}>
                                <div className="d-flex align-items-start">
                                  <i className="bi bi-people-fill me-10px fs-18 mt-1px" style={{ color: '#2563eb' }}></i>
                                  <div style={{ color: '#1e3a5f' }}>
                                    <strong>Takım Üyesi Kuralı:</strong> Kendiniz dahil <strong>minimum 3, maksimum 5 kişilik</strong> takım oluşturmanız gerekmektedir.
                                    <span className="d-block mt-5px" style={{ fontSize: '13px' }}>
                                      Aşağıya kendiniz dışındaki takım üyelerinizi (en az 2, en fazla 4 kişi) ekleyiniz.
                                    </span>
                                    <span className="d-block mt-3px" style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>
                                      <i className="bi bi-x-circle-fill me-5px"></i>Lütfen kendinizi takım üyesi olarak eklemeyiniz. Siz otomatik olarak takım lideri olarak kaydedilmektesiniz.
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Min üye uyarısı - daha önceden az eklemiş olanlar için */}
                              {isEditMode && teamMembers.filter(m => m.name.trim()).length < 2 && (
                                <div className="alert border-radius-8px p-15px mb-15px" style={{ 
                                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                  border: '2px solid #f59e0b'
                                }}>
                                  <div className="d-flex align-items-start">
                                    <i className="bi bi-exclamation-triangle-fill me-10px fs-18 mt-1px" style={{ color: '#f59e0b' }}></i>
                                    <div style={{ color: '#78350f' }}>
                                      <strong>Uyarı:</strong> Takımınızda kendiniz dahil en az 3 kişi olmalıdır. Lütfen en az <strong>2 takım üyesi</strong> daha ekleyiniz.
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Sistem Üyeliği Notu */}
                              <div className="alert alert-info border-radius-8px p-15px">
                                <div className="d-flex align-items-start">
                                  <i className="bi bi-info-circle-fill text-info me-10px fs-18 mt-1px"></i>
                                  <div>
                                    <strong>Not:</strong> Takım başvurularında ekip üyelerinin ayrıca sisteme üye olması veya bireysel başvuru yapması gerekmemektedir.
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Team Members List */}
                            <div className="team-members-container">
                              {teamMembers.map((member, index) => (
                                <div key={index} className="team-member-card">
                                  <div className="team-member-header">
                                    <div className="member-avatar">
                                      <i className="bi bi-person-circle"></i>
                                    </div>
                                    <div className="member-info">
                                      <h5 className="member-title">Takım Üyesi {index + 1}</h5>
                                      <span className="member-subtitle">Üye bilgilerini doldurun</span>
                                    </div>
                                    {teamMembers.length > 1 && (
                                      <button
                                        type="button"
                                        className="member-remove-btn"
                                        onClick={() => removeTeamMember(index)}
                                        title="Üyeyi kaldır"
                                      >
                                        <i className="bi bi-x-lg"></i>
                                      </button>
                                    )}
                                  </div>

                                  <div className="team-member-body">
                                    <div className="row g-20px">
                                      <div className="col-md-6">
                                        <div className="input-group-custom">
                                          <label className="input-label">
                                            <i className="bi bi-person"></i>
                                            Ad Soyad <span className="text-red">*</span>
                                          </label>
                                          <input
                                            type="text"
                                            className={`form-control-modern ${errors[`teamMember_${index}_name`] ? 'error-field' : ''}`}
                                            placeholder="Örn: Ahmet Yılmaz"
                                            value={member.name}
                                            onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                                            required={showTeam}
                                          />
                                          {errors[`teamMember_${index}_name`] && (
                                            <div className="field-error">
                                              <i className="bi bi-exclamation-triangle"></i>
                                              {errors[`teamMember_${index}_name`]}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="col-md-6">
                                        <div className="input-group-custom">
                                          <label className="input-label">
                                            <i className="bi bi-credit-card"></i>
                                            TC Kimlik No <span className="text-red">*</span>
                                          </label>
                                          <input
                                            type="text"
                                            className={`form-control-modern ${errors[`teamMember_${index}_tcIdentity`] ? 'error-field' : ''}`}
                                            placeholder="11 haneli TC kimlik numarası"
                                            maxLength="11"
                                            value={member.tcIdentity}
                                            onChange={(e) => handleTeamMemberChange(index, 'tcIdentity', e.target.value)}
                                            required={showTeam}
                                          />
                                          {errors[`teamMember_${index}_tcIdentity`] && (
                                            <div className="field-error">
                                              <i className="bi bi-exclamation-triangle"></i>
                                              {errors[`teamMember_${index}_tcIdentity`]}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="col-12">
                                        <div className="input-group-custom">
                                          <label className="input-label">
                                            <i className="bi bi-briefcase"></i>
                                            Rol / Görev
                                          </label>
                                          <input
                                            type="text"
                                            className={`form-control-modern ${errors[`teamMember_${index}_role`] ? 'error-field' : ''}`}
                                            placeholder="Örn: Yazılım Geliştirici, Tasarımcı, Proje Yöneticisi"
                                            value={member.role}
                                            onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                                          />
                                          {errors[`teamMember_${index}_role`] && (
                                            <div className="field-error">
                                              <i className="bi bi-exclamation-triangle"></i>
                                              {errors[`teamMember_${index}_role`]}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Add Member Button */}
                            <div className="text-center mt-30px">
                              <button
                                type="button"
                                className="btn-add-member"
                                onClick={addTeamMember}
                              >
                                <i className="bi bi-plus-circle-fill"></i>
                                <span>Yeni Üye Ekle</span>
                              </button>
                            </div>

                            {errors.teamMembers && (
                              <div className="field-error text-center mt-20px">
                                <i className="bi bi-exclamation-triangle me-5px"></i>
                                {errors.teamMembers}
                              </div>
                            )}

                            {/* Team Members Custom Styles */}
                            <style jsx>{`
                              /* Team Members Container */
                              .team-members-container {
                                display: flex;
                                flex-direction: column;
                                gap: 24px;
                              }

                              /* Team Member Card */
                              .team-member-card {
                                background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                                border: 2px solid #e2e8f0;
                                border-radius: 16px;
                                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                                transition: all 0.3s ease;
                                overflow: hidden;
                              }

                              .team-member-card:hover {
                                border-color: #0092f3;
                                box-shadow: 0 8px 30px rgba(0, 146, 243, 0.15);
                                transform: translateY(-2px);
                              }

                              /* Team Member Header */
                              .team-member-header {
                                display: flex;
                                align-items: center;
                                padding: 20px 24px;
                                background: linear-gradient(135deg, #042070 0%, #0092f3 100%);
                                color: white;
                                position: relative;
                              }

                              .member-avatar {
                                width: 50px;
                                height: 50px;
                                border-radius: 50%;
                                background: rgba(255, 255, 255, 0.2);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                margin-right: 16px;
                                font-size: 24px;
                              }

                              .member-info {
                                flex: 1;
                              }

                              .member-title {
                                margin: 0 0 4px 0;
                                font-size: 16px;
                                font-weight: 600;
                                color: white;
                              }

                              .member-subtitle {
                                font-size: 12px;
                                opacity: 0.8;
                                margin: 0;
                              }

                              .member-remove-btn {
                                width: 32px;
                                height: 32px;
                                border-radius: 50%;
                                background: rgba(255, 255, 255, 0.2);
                                border: none;
                                color: white;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                font-size: 14px;
                              }

                              .member-remove-btn:hover {
                                background: rgba(239, 68, 68, 0.9);
                                transform: scale(1.1);
                              }

                              /* Team Member Body */
                              .team-member-body {
                                padding: 24px;
                              }

                              /* Input Group Custom */
                              .input-group-custom {
                                margin-bottom: 20px;
                              }

                              .input-group-custom:last-child {
                                margin-bottom: 0;
                              }

                              .input-label {
                                display: flex;
                                align-items: center;
                                font-size: 14px;
                                font-weight: 600;
                                color: #374151;
                                margin-bottom: 8px;
                              }

                              .input-label i {
                                margin-right: 8px;
                                color: #0092f3;
                                font-size: 16px;
                              }

                              /* Modern Form Control */
                              .form-control-modern {
                                width: 100%;
                                padding: 14px 18px;
                                border: 2px solid #e2e8f0;
                                border-radius: 12px;
                                background: white;
                                font-size: 15px;
                                color: #042070;
                                transition: all 0.3s ease;
                                font-family: var(--primary-font, inherit);
                              }

                              .form-control-modern:focus {
                                outline: none;
                                border-color: #0092f3;
                                box-shadow: 0 0 0 4px rgba(0, 146, 243, 0.1);
                                background: white;
                              }

                              .form-control-modern.error-field {
                                border-color: #ef4444;
                                background-color: #fef2f2;
                              }

                              .form-control-modern.error-field:focus {
                                border-color: #dc2626;
                                box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
                              }

                              .form-control-modern::placeholder {
                                color: #9ca3af;
                                font-style: italic;
                              }

                              /* Field Error */
                              .field-error {
                                display: flex;
                                align-items: center;
                                color: #dc2626;
                                font-size: 13px;
                                margin-top: 6px;
                                font-weight: 500;
                              }

                              .field-error i {
                                margin-right: 6px;
                                font-size: 12px;
                              }

                              /* Team Count Badge */
                              .team-count-badge {
                                animation: pulse 2s infinite;
                              }

                              @keyframes pulse {
                                0%, 100% {
                                  opacity: 1;
                                }
                                50% {
                                  opacity: 0.7;
                                }
                              }

                              /* Add Member Button */
                              .btn-add-member {
                                display: inline-flex;
                                align-items: center;
                                gap: 12px;
                                padding: 16px 32px;
                                background: linear-gradient(135deg, #042070 0%, #0092f3 100%);
                                color: white;
                                border: none;
                                border-radius: 12px;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                box-shadow: 0 4px 15px rgba(0, 146, 243, 0.3);
                                text-decoration: none;
                              }

                              .btn-add-member:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 6px 20px rgba(0, 146, 243, 0.4);
                              }

                              .btn-add-member:active {
                                transform: translateY(0);
                              }

                              .btn-add-member i {
                                font-size: 20px;
                              }

                              /* Responsive Design */
                              @media (max-width: 768px) {
                                .team-member-header {
                                  padding: 16px 20px;
                                }

                                .member-avatar {
                                  width: 40px;
                                  height: 40px;
                                  font-size: 20px;
                                }

                                .member-title {
                                  font-size: 14px;
                                }

                                .team-member-body {
                                  padding: 20px;
                                }

                                .form-control-modern {
                                  padding: 12px 16px;
                                  font-size: 14px;
                                }

                                .btn-add-member {
                                  padding: 14px 24px;
                                  font-size: 15px;
                                }
                              }

                              @media (max-width: 480px) {
                                .team-member-card {
                                  margin: 0 -10px;
                                }

                                .team-member-body {
                                  padding: 16px;
                                }

                                .input-group-custom {
                                  margin-bottom: 16px;
                                }
                              }
                            `}</style>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 5: Gözlem ve İlgi Alanı */}
                <div className="form-section mb-50px">
                  <div className="section-header mb-30px">
                    <div className="section-number">5</div>
                    <h3 className="section-title alt-font text-dark-gray fw-600 fs-24">Gözlem ve İlgi Alanı</h3>
                  </div>

                  <div className="form-group mb-40px">
                    <label className="form-label text-dark-gray fw-500 mb-20px">Ideathon teması doğrultusunda hangi spesifik probleme yönelik çözüm geliştirmeyi planlıyorsunuz?</label>
                    {errors.ilgiAlanlari && <div className="field-error mb-3">{errors.ilgiAlanlari}</div>}
                    <div className="checkbox-grid">
                      {(FOCUS_AREAS[slug] || FOCUS_AREAS['ideathon-2025']).map((area) => (
                        <div className="checkbox-option" key={area.id}>
                          <input type="checkbox" id={`focus_${area.id}`} name="ilgiAlanlari[]" value={area.label} className="checkbox-input" checked={formData.ilgiAlanlari.includes(area.label)} onChange={handleChange} />
                          <label htmlFor={`focus_${area.id}`} className="checkbox-label">{area.label}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group mb-30px">
                    <label className="form-label text-dark-gray fw-500 mb-15px">İlgili odak alanında daha önce yürüttüğünüz bir çalışma, girişim veya etkinlik katılımınız var mıydı?</label>
                    <div className="radio-group">
                      <div className="radio-option">
                        <input type="radio" id="oncekiCalismaEvet" name="oncekiCalisma" value="evet" className="radio-input" checked={formData.oncekiCalisma === 'evet'} onChange={handleChange} />
                        <label htmlFor="oncekiCalismaEvet" className="radio-label">Evet</label>
                      </div>
                      <div className="radio-option">
                        <input type="radio" id="oncekiCalismaHayir" name="oncekiCalisma" value="hayir" className="radio-input" checked={formData.oncekiCalisma === 'hayir'} onChange={handleChange} />
                        <label htmlFor="oncekiCalismaHayir" className="radio-label">Hayır</label>
                      </div>
                    </div>
                  </div>

                  {formData.oncekiCalisma === 'evet' && (
                    <div className="form-group">
                      <label htmlFor="oncekiCalismaAciklama" className="form-label text-dark-gray fw-500 mb-10px">Evet ise, kısaca açıklayınız:</label>
                      <textarea
                        id="oncekiCalismaAciklama"
                        name="oncekiCalismaAciklama"
                        className="form-control border-radius-8px"
                        rows="4"
                        placeholder="Önceki çalışmalarınızı kısaca açıklayınız"
                        value={formData.oncekiCalismaAciklama}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                </div>

                {/* Section 6: Yetkinlik ve Katkı Alanlarınız - Basitleştirilmiş */}
                <div className="form-section mb-50px">
                  <div className="section-header mb-30px">
                    <div className="section-number">6</div>
                    <h3 className="section-title alt-font text-dark-gray fw-600 fs-24">Yetkinlik ve Katkı Alanlarınız</h3>
                  </div>
                  <div className="form-group mb-30px">
                    <label className="form-label text-dark-gray fw-500 mb-20px">Kendinizi yakın hissettiğiniz alanları işaretleyiniz:</label>
                    {errors.yetkinlikAlanlari && <div className="field-error mb-3">{errors.yetkinlikAlanlari}</div>}
                    <div className="checkbox-grid">
                      <div className="checkbox-option">
                        <input type="checkbox" id="problemAnalizi" name="yetkinlikAlanlari[]" value="problemAnalizi" className="checkbox-input" checked={formData.yetkinlikAlanlari.includes('problemAnalizi')} onChange={handleChange} />
                        <label htmlFor="problemAnalizi" className="checkbox-label">Problem analizi ve araştırma</label>
                      </div>
                      <div className="checkbox-option">
                        <input type="checkbox" id="yenilikciCozum" name="yetkinlikAlanlari[]" value="yenilikciCozum" className="checkbox-input" checked={formData.yetkinlikAlanlari.includes('yenilikciCozum')} onChange={handleChange} />
                        <label htmlFor="yenilikciCozum" className="checkbox-label">Yenilikçi çözüm üretme</label>
                      </div>
                      <div className="checkbox-option">
                        <input type="checkbox" id="kullaniciDeneyimi" name="yetkinlikAlanlari[]" value="kullaniciDeneyimi" className="checkbox-input" checked={formData.yetkinlikAlanlari.includes('kullaniciDeneyimi')} onChange={handleChange} />
                        <label htmlFor="kullaniciDeneyimi" className="checkbox-label">Kullanıcı deneyimi ve tasarım</label>
                      </div>
                      <div className="checkbox-option">
                        <input type="checkbox" id="sunumHikaye" name="yetkinlikAlanlari[]" value="sunumHikaye" className="checkbox-input" checked={formData.yetkinlikAlanlari.includes('sunumHikaye')} onChange={handleChange} />
                        <label htmlFor="sunumHikaye" className="checkbox-label">Sunum ve hikâyeleştirme</label>
                      </div>
                      <div className="checkbox-option">
                        <input type="checkbox" id="teknikGelistirme" name="yetkinlikAlanlari[]" value="teknikGelistirme" className="checkbox-input" checked={formData.yetkinlikAlanlari.includes('teknikGelistirme')} onChange={handleChange} />
                        <label htmlFor="teknikGelistirme" className="checkbox-label">Teknik geliştirme (yazılım / donanım)</label>
                      </div>
                      <div className="checkbox-option">
                        <input type="checkbox" id="sosyalEtki" name="yetkinlikAlanlari[]" value="sosyalEtki" className="checkbox-input" checked={formData.yetkinlikAlanlari.includes('sosyalEtki')} onChange={handleChange} />
                        <label htmlFor="sosyalEtki" className="checkbox-label">Sosyal etki ve topluluk çalışmaları</label>
                      </div>
                    </div>
                  </div>

                  <div className="form-group mb-30px">
                    <label htmlFor="digerYetkinlik" className="form-label text-dark-gray fw-500 mb-10px">Diğer:</label>
                    <input
                      type="text"
                      id="digerYetkinlik"
                      name="digerYetkinlik"
                      className="form-control border-radius-8px"
                      placeholder="Başka yetkinlik alanlarınız varsa belirtiniz"
                      value={formData.digerYetkinlik}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group mb-30px">
                    <label htmlFor="ucKelime" className="form-label text-dark-gray fw-500 mb-10px">Kendinizi üç kelime ile tanımlayınız:</label>
                    <input
                      type="text"
                      id="ucKelime"
                      name="ucKelime"
                      className="form-control border-radius-8px"
                      placeholder="örn: Yaratıcı, Analitik, Takım Oyuncusu"
                      value={formData.ucKelime}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="katilimMotivasyonu" className="form-label text-dark-gray fw-500 mb-10px">Emlak Konut Ideathon&apos;a katılım motivasyonunuzu kısaca açıklayınız: <span className="text-red">*</span></label>
                    <textarea
                      id="katilimMotivasyonu"
                      name="katilimMotivasyonu"
                      className={`form-control border-radius-8px ${errors.katilimMotivasyonu ? 'error-field' : ''}`}
                      rows="4"
                      placeholder="Katılım motivasyonunuzu açıklayınız"
                      value={formData.katilimMotivasyonu}
                      onChange={handleChange}
                      required
                    ></textarea>
                    {errors.katilimMotivasyonu && <div className="field-error">{errors.katilimMotivasyonu}</div>}
                  </div>
                </div>

                {/* Section 7: Ek Bilgi */}
                <div className="form-section mb-50px">
                  <div className="section-header mb-30px">
                    <div className="section-number">7</div>
                    <h3 className="section-title alt-font text-dark-gray fw-600 fs-24">Ek Bilgi (İsteğe Bağlı)</h3>
                  </div>
                  <div className="row g-30px">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="projeLink" className="form-label text-dark-gray fw-500 mb-10px">Proje / Çalışma / Portfolyo Linki (varsa):</label>
                        <input
                          type="url"
                          id="projeLink"
                          name="projeLink"
                          className="form-control border-radius-8px"
                          placeholder="https://github.com/kullanici/repo"
                          value={formData.projeLink}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="tanitimVideo" className="form-label text-dark-gray fw-500 mb-10px">Tanıtım Videosu Linki (varsa):</label>
                        <input
                          type="url"
                          id="tanitimVideo"
                          name="tanitimVideo"
                          className="form-control border-radius-8px"
                          placeholder="https://youtube.com/watch?v=..."
                          value={formData.tanitimVideo}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 8: Katılım Onayı */}
                <div className="form-section">
                  <div className="section-header mb-30px">
                    <div className="section-number">8</div>
                    <h3 className="section-title alt-font text-dark-gray fw-600 fs-24">Katılım Onayı</h3>
                  </div>
                  <div className="consent-section">
                    <div className="consent-item mb-20px">
                      <div className="checkbox-wrapper">
                        <input
                          type="checkbox"
                          id="bilgiDogru"
                          name="bilgiDogru"
                          className="checkbox-input-enhanced"
                          checked={formData.bilgiDogru}
                          onChange={handleChange}
                          required
                        />
                        <div className="checkbox-display" onClick={() => document.getElementById('bilgiDogru').click()}></div>
                        <label htmlFor="bilgiDogru" className="checkbox-label-enhanced">
                          Formda verdiğim bilgilerin doğru olduğunu beyan ederim.
                        </label>
                      </div>
                      {errors.bilgiDogru && <div className="field-error">{errors.bilgiDogru}</div>}
                    </div>
                    <div className="consent-item mb-20px">
                      <div className="checkbox-wrapper">
                        <input
                          type="checkbox"
                          id="kurallariKabul"
                          name="kurallariKabul"
                          className="checkbox-input-enhanced"
                          checked={formData.kurallariKabul}
                          onChange={(e) => {
                            setShowRulesModal(true);
                          }}
                          onClick={(e) => {
                            setShowRulesModal(true);
                          }}
                          required
                        />
                        <div className="checkbox-display" onClick={() => {
                          setShowRulesModal(true);
                          document.getElementById('kurallariKabul').click();
                        }}></div>
                        <label htmlFor="kurallariKabul" className="checkbox-label-enhanced">
                          Etkinlik kurallarına uyum sağlayacağımı kabul ederim.
                        </label>
                      </div>
                      {errors.kurallariKabul && <div className="field-error">{errors.kurallariKabul}</div>}
                    </div>
                    <div className="consent-item mb-30px">
                      <div className="checkbox-wrapper">
                        <input
                          type="checkbox"
                          id="kvkkOnay"
                          name="kvkkOnay"
                          className="checkbox-input-enhanced"
                          checked={formData.kvkkOnay}
                          onChange={(e) => {
                            setShowKvkkModal(true);
                          }}
                          onClick={(e) => {
                            setShowKvkkModal(true);
                          }}
                          required
                        />
                        <div className="checkbox-display" onClick={() => {
                          setShowKvkkModal(true);
                          document.getElementById('kvkkOnay').click();
                        }}></div>
                        <label htmlFor="kvkkOnay" className="checkbox-label-enhanced">
                          Kişisel verilerimin KVKK kapsamında işlenmesine onay veriyorum.
                        </label>
                      </div>
                      {errors.kvkkOnay && <div className="field-error">{errors.kvkkOnay}</div>}
                    </div>
                  </div>
                  <div className="form-actions-mobile">
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() => router.push('/basvurularim')}
                        className="btn-cancel-mobile"
                        disabled={isSubmitting}
                      >
                        <span>İptal</span>
                        <i className="bi bi-x-circle"></i>
                      </button>
                    )}
                    <button type="submit" className="btn-submit-mobile" disabled={isSubmitting}>
                      <span>
                        {isSubmitting
                          ? (isEditMode ? 'Güncelleniyor...' : 'Gönderiliyor...')
                          : (isEditMode ? 'Değişiklikleri Kaydet' : 'Başvuruyu Gönder')
                        }
                      </span>
                      <i className={`bi ${isSubmitting ? 'bi-arrow-repeat spinning' : (isEditMode ? 'bi-check-circle' : 'bi-send')}`}></i>
                    </button>
                  </div>
                  
                  <style jsx>{`
                    /* Mobile Form Actions */
                    .form-actions-mobile {
                      display: flex;
                      flex-direction: column;
                      gap: 16px;
                      width: 100%;
                    }

                    .btn-cancel-mobile,
                    .btn-submit-mobile {
                      width: 100%;
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      gap: 12px;
                      padding: 16px 24px;
                      border-radius: 12px;
                      font-size: 16px;
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.3s ease;
                      border: none;
                      min-height: 56px;
                    }

                    .btn-cancel-mobile {
                      background: white;
                      color: #64748b;
                      border: 2px solid #e2e8f0;
                    }

                    .btn-cancel-mobile:hover:not(:disabled) {
                      background: #f8fafc;
                      border-color: #cbd5e1;
                      color: #475569;
                      transform: translateY(-2px);
                      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    }

                    .btn-submit-mobile {
                      background: linear-gradient(135deg, #0092f3 0%, #042070 100%);
                      color: white;
                    }

                    .btn-submit-mobile:hover:not(:disabled) {
                      transform: translateY(-2px);
                      box-shadow: 0 6px 20px rgba(0, 146, 243, 0.3);
                    }

                    .btn-cancel-mobile:disabled,
                    .btn-submit-mobile:disabled {
                      opacity: 0.6;
                      cursor: not-allowed;
                      transform: none;
                      box-shadow: none;
                    }

                    /* Responsive adjustments */
                    @media (min-width: 768px) {
                      .form-actions-mobile {
                        flex-direction: row;
                        justify-content: center;
                        gap: 20px;
                      }

                      .btn-cancel-mobile,
                      .btn-submit-mobile {
                        width: auto;
                        min-width: 200px;
                        flex: 0 0 auto;
                      }
                    }
                  `}</style>
                </div>
                
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Success Modal */}
      {showSuccess && (
        <div className="success-modal-overlay" style={{ display: 'flex' }} onClick={closeSuccessModal}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-modal-content">
              <div className="success-icon">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <h2 className="success-title">Başvurunuz Alındı!</h2>
              {applicationNumber && (
                <div className="application-number-box">
                  <p className="application-number-label">Başvuru Numaranız:</p>
                  <p className="application-number">{applicationNumber}</p>
                </div>
              )}
              <p className="success-message">Katılımınız için teşekkür ederiz. Başvurunuzu değerlendirdikten sonra sizinle iletişime geçeceğiz. Başvuru numaranızı not alınız.</p>
              <button className="success-close-btn" onClick={closeSuccessModal}>
                <span>Başvurularımı Görüntüle</span>
                <i className="bi bi-arrow-right"></i>
              </button>
              <style jsx>{`
                .application-number-box {
                  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                  border: 2px solid #2563eb;
                  border-radius: 12px;
                  padding: 20px;
                  margin: 20px 0;
                }
                .application-number-label {
                  font-size: 14px;
                  color: #64748b;
                  margin: 0 0 8px 0;
                  font-weight: 500;
                }
                .application-number {
                  font-size: 24px;
                  font-weight: 700;
                  color: #2563eb;
                  margin: 0;
                  letter-spacing: 1px;
                  font-family: 'Courier New', monospace;
                }
              `}</style>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      <RulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        onAccept={handleRulesAccept}
      />

      {/* KVKK Modal */}
      <KvkkModal
        isOpen={showKvkkModal}
        onClose={() => setShowKvkkModal(false)}
        onAccept={handleKvkkAccept}
      />
    </>
  )
})

ApplicationForm.displayName = 'ApplicationForm'

export default ApplicationForm

