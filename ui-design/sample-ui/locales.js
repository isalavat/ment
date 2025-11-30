// Locales for Mentor Platform
// Supported languages: English (en), Russian (ru), Kyrgyz (ky)

export const locales = {
  en: {
    // Navigation
    nav: {
      home: "Home",
      mentors: "Find Mentors",
      bookings: "My Bookings",
      profile: "Profile",
      logout: "Logout",
      login: "Login",
      register: "Register"
    },
    
    // Common
    common: {
      search: "Search",
      filter: "Filter",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      submit: "Submit",
      back: "Back",
      next: "Next",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      confirm: "Confirm",
      viewDetails: "View Details",
      learnMore: "Learn More",
      getStarted: "Get Started"
    },
    
    // Home Page
    home: {
      hero: {
        title: "Find Your Perfect Mentor",
        subtitle: "Connect with experienced professionals who can guide your career journey",
        cta: "Browse Mentors",
        secondary: "How It Works"
      },
      features: {
        title: "Why Choose MentorHub",
        expertMentors: {
          title: "Expert Mentors",
          description: "Learn from industry professionals with years of experience"
        },
        flexibleScheduling: {
          title: "Flexible Scheduling",
          description: "Book sessions that fit your schedule"
        },
        affordablePrices: {
          title: "Affordable Prices",
          description: "Quality mentorship at competitive rates"
        },
        securePayments: {
          title: "Secure Payments",
          description: "Safe and reliable payment processing"
        }
      },
      stats: {
        mentors: "Expert Mentors",
        students: "Active Students",
        sessions: "Sessions Completed",
        satisfaction: "Satisfaction Rate"
      }
    },
    
    // Authentication
    auth: {
      login: {
        title: "Welcome Back",
        subtitle: "Sign in to your account",
        email: "Email Address",
        password: "Password",
        remember: "Remember me",
        forgot: "Forgot password?",
        submit: "Sign In",
        noAccount: "Don't have an account?",
        signUp: "Sign up",
        orContinue: "Or continue with"
      },
      register: {
        title: "Join MentorHub",
        subtitle: "Create your account to get started",
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email Address",
        password: "Password",
        confirmPassword: "Confirm Password",
        passwordHint: "Must be at least 8 characters",
        role: "I want to join as",
        selectRole: "Select your role",
        mentee: "Mentee - I'm looking for mentorship",
        mentor: "Mentor - I want to help others",
        terms: "I agree to the",
        termsLink: "Terms of Service",
        and: "and",
        privacyLink: "Privacy Policy",
        submit: "Create Account",
        hasAccount: "Already have an account?",
        signIn: "Sign in",
        orSignUp: "Or sign up with"
      },
      validation: {
        emailRequired: "Email is required",
        emailInvalid: "Please enter a valid email",
        passwordRequired: "Password is required",
        passwordTooShort: "Password must be at least 8 characters",
        passwordsMismatch: "Passwords do not match",
        firstNameRequired: "First name is required",
        lastNameRequired: "Last name is required",
        roleRequired: "Please select a role",
        termsRequired: "You must accept the terms and conditions"
      }
    },
    
    // Mentors Page
    mentors: {
      title: "Find Your Mentor",
      searchPlaceholder: "Search by name or expertise...",
      filterByCategory: "Filter by Category",
      allCategories: "All Categories",
      filterByPrice: "Price Range",
      resultsCount: "mentors found",
      noResults: "No mentors found",
      noResultsDesc: "Try adjusting your search or filters",
      perHour: "/hour",
      rating: "Rating",
      reviews: "reviews",
      sessions: "sessions",
      viewProfile: "View Profile",
      bookSession: "Book Session",
      categories: {
        technology: "Technology",
        business: "Business",
        design: "Design",
        marketing: "Marketing",
        career: "Career Development",
        language: "Languages",
        other: "Other"
      }
    },
    
    // Mentor Profile
    profile: {
      about: "About",
      expertise: "Expertise",
      experience: "Experience",
      education: "Education",
      languages: "Languages",
      availability: "Availability",
      reviews: "Reviews",
      rating: "Rating",
      totalReviews: "Total Reviews",
      completedSessions: "Completed Sessions",
      responseTime: "Response Time",
      within24h: "Within 24 hours",
      bookSession: "Book a Session",
      pricePerHour: "Price per hour",
      selectDateTime: "Select Date & Time",
      writeReview: "Write a Review",
      readMore: "Read more",
      readLess: "Read less",
      showAllReviews: "Show all reviews"
    },
    
    // Bookings Page
    bookings: {
      title: "My Bookings",
      tabs: {
        upcoming: "Upcoming",
        past: "Past",
        cancelled: "Cancelled"
      },
      noBookings: "No bookings found",
      noBookingsDesc: "You don't have any bookings yet",
      browseMentors: "Browse Mentors",
      sessionWith: "Session with",
      date: "Date",
      time: "Time",
      duration: "Duration",
      price: "Price",
      status: "Status",
      statusValues: {
        confirmed: "Confirmed",
        pending: "Pending",
        completed: "Completed",
        cancelled: "Cancelled"
      },
      actions: {
        reschedule: "Reschedule",
        cancel: "Cancel Booking",
        joinSession: "Join Session",
        leaveReview: "Leave Review",
        viewDetails: "View Details"
      },
      confirmCancel: "Are you sure you want to cancel this booking?",
      cancelSuccess: "Booking cancelled successfully",
      minutes: "minutes",
      hour: "hour",
      hours: "hours"
    },
    
    // Booking Details
    bookingDetails: {
      title: "Booking Details",
      bookingId: "Booking ID",
      mentorInfo: "Mentor Information",
      sessionDetails: "Session Details",
      topic: "Topic",
      notes: "Notes",
      meetingLink: "Meeting Link",
      joinMeeting: "Join Meeting",
      paymentInfo: "Payment Information",
      subtotal: "Subtotal",
      platformFee: "Platform Fee",
      total: "Total",
      paymentMethod: "Payment Method",
      paymentStatus: "Payment Status",
      paid: "Paid",
      pending: "Pending",
      actions: "Actions",
      downloadReceipt: "Download Receipt",
      contactSupport: "Contact Support"
    },
    
    // Profile Edit
    profileEdit: {
      title: "Edit Profile",
      personalInfo: "Personal Information",
      professionalInfo: "Professional Information",
      accountSettings: "Account Settings",
      profilePhoto: "Profile Photo",
      changePhoto: "Change Photo",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone Number",
      bio: "Bio",
      bioPlaceholder: "Tell us about yourself...",
      title: "Professional Title",
      titlePlaceholder: "e.g. Senior Software Engineer",
      company: "Company",
      companyPlaceholder: "e.g. Google",
      expertise: "Areas of Expertise",
      expertisePlaceholder: "Add expertise (press Enter)",
      hourlyRate: "Hourly Rate ($)",
      availability: "Availability",
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
      from: "From",
      to: "To",
      changePassword: "Change Password",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmNewPassword: "Confirm New Password",
      notifications: "Email Notifications",
      notifyBookings: "New bookings",
      notifyMessages: "New messages",
      notifyReminders: "Session reminders",
      saveChanges: "Save Changes",
      cancel: "Cancel",
      updateSuccess: "Profile updated successfully",
      updateError: "Failed to update profile"
    },
    
    // Messages & Notifications
    messages: {
      noMessages: "No messages yet",
      typeMessage: "Type a message...",
      send: "Send",
      online: "Online",
      offline: "Offline",
      typing: "typing..."
    },
    
    // Errors
    errors: {
      networkError: "Network error. Please check your connection.",
      serverError: "Server error. Please try again later.",
      unauthorized: "You need to log in to access this page.",
      notFound: "Page not found.",
      forbidden: "You don't have permission to access this resource.",
      validationError: "Please check your input and try again."
    }
  },
  
  ru: {
    // Навигация
    nav: {
      home: "Главная",
      mentors: "Найти Менторов",
      bookings: "Мои Бронирования",
      profile: "Профиль",
      logout: "Выйти",
      login: "Войти",
      register: "Регистрация"
    },
    
    // Общие
    common: {
      search: "Поиск",
      filter: "Фильтр",
      save: "Сохранить",
      cancel: "Отмена",
      edit: "Редактировать",
      delete: "Удалить",
      submit: "Отправить",
      back: "Назад",
      next: "Далее",
      loading: "Загрузка...",
      error: "Ошибка",
      success: "Успешно",
      confirm: "Подтвердить",
      viewDetails: "Подробнее",
      learnMore: "Узнать больше",
      getStarted: "Начать"
    },
    
    // Главная страница
    home: {
      hero: {
        title: "Найдите Своего Идеального Ментора",
        subtitle: "Свяжитесь с опытными профессионалами, которые помогут вам в карьере",
        cta: "Просмотреть Менторов",
        secondary: "Как Это Работает"
      },
      features: {
        title: "Почему MentorHub",
        expertMentors: {
          title: "Опытные Менторы",
          description: "Учитесь у профессионалов с многолетним опытом"
        },
        flexibleScheduling: {
          title: "Гибкое Расписание",
          description: "Бронируйте сессии в удобное для вас время"
        },
        affordablePrices: {
          title: "Доступные Цены",
          description: "Качественное наставничество по конкурентным ценам"
        },
        securePayments: {
          title: "Безопасные Платежи",
          description: "Надежная обработка платежей"
        }
      },
      stats: {
        mentors: "Экспертных Менторов",
        students: "Активных Студентов",
        sessions: "Проведенных Сессий",
        satisfaction: "Удовлетворенность"
      }
    },
    
    // Аутентификация
    auth: {
      login: {
        title: "С Возвращением",
        subtitle: "Войдите в свой аккаунт",
        email: "Электронная почта",
        password: "Пароль",
        remember: "Запомнить меня",
        forgot: "Забыли пароль?",
        submit: "Войти",
        noAccount: "Нет аккаунта?",
        signUp: "Зарегистрироваться",
        orContinue: "Или продолжить с"
      },
      register: {
        title: "Присоединяйтесь к MentorHub",
        subtitle: "Создайте аккаунт, чтобы начать",
        firstName: "Имя",
        lastName: "Фамилия",
        email: "Электронная почта",
        password: "Пароль",
        confirmPassword: "Подтвердите пароль",
        passwordHint: "Минимум 8 символов",
        role: "Я хочу присоединиться как",
        selectRole: "Выберите роль",
        mentee: "Менти - Я ищу наставника",
        mentor: "Ментор - Я хочу помогать другим",
        terms: "Я согласен с",
        termsLink: "Условиями использования",
        and: "и",
        privacyLink: "Политикой конфиденциальности",
        submit: "Создать аккаунт",
        hasAccount: "Уже есть аккаунт?",
        signIn: "Войти",
        orSignUp: "Или зарегистрироваться с"
      },
      validation: {
        emailRequired: "Email обязателен",
        emailInvalid: "Введите корректный email",
        passwordRequired: "Пароль обязателен",
        passwordTooShort: "Пароль должен содержать минимум 8 символов",
        passwordsMismatch: "Пароли не совпадают",
        firstNameRequired: "Имя обязательно",
        lastNameRequired: "Фамилия обязательна",
        roleRequired: "Выберите роль",
        termsRequired: "Вы должны принять условия использования"
      }
    },
    
    // Страница менторов
    mentors: {
      title: "Найдите Вашего Ментора",
      searchPlaceholder: "Поиск по имени или специализации...",
      filterByCategory: "Фильтр по категории",
      allCategories: "Все категории",
      filterByPrice: "Ценовой диапазон",
      resultsCount: "менторов найдено",
      noResults: "Менторы не найдены",
      noResultsDesc: "Попробуйте изменить поиск или фильтры",
      perHour: "/час",
      rating: "Рейтинг",
      reviews: "отзывов",
      sessions: "сессий",
      viewProfile: "Смотреть профиль",
      bookSession: "Забронировать",
      categories: {
        technology: "Технологии",
        business: "Бизнес",
        design: "Дизайн",
        marketing: "Маркетинг",
        career: "Развитие карьеры",
        language: "Языки",
        other: "Другое"
      }
    },
    
    // Профиль ментора
    profile: {
      about: "О себе",
      expertise: "Экспертиза",
      experience: "Опыт",
      education: "Образование",
      languages: "Языки",
      availability: "Доступность",
      reviews: "Отзывы",
      rating: "Рейтинг",
      totalReviews: "Всего отзывов",
      completedSessions: "Проведено сессий",
      responseTime: "Время ответа",
      within24h: "В течение 24 часов",
      bookSession: "Забронировать сессию",
      pricePerHour: "Цена за час",
      selectDateTime: "Выберите дату и время",
      writeReview: "Написать отзыв",
      readMore: "Читать далее",
      readLess: "Свернуть",
      showAllReviews: "Показать все отзывы"
    },
    
    // Страница бронирований
    bookings: {
      title: "Мои Бронирования",
      tabs: {
        upcoming: "Предстоящие",
        past: "Прошедшие",
        cancelled: "Отмененные"
      },
      noBookings: "Бронирований не найдено",
      noBookingsDesc: "У вас пока нет бронирований",
      browseMentors: "Просмотреть менторов",
      sessionWith: "Сессия с",
      date: "Дата",
      time: "Время",
      duration: "Длительность",
      price: "Цена",
      status: "Статус",
      statusValues: {
        confirmed: "Подтверждено",
        pending: "В ожидании",
        completed: "Завершено",
        cancelled: "Отменено"
      },
      actions: {
        reschedule: "Перенести",
        cancel: "Отменить бронирование",
        joinSession: "Присоединиться к сессии",
        leaveReview: "Оставить отзыв",
        viewDetails: "Подробнее"
      },
      confirmCancel: "Вы уверены, что хотите отменить это бронирование?",
      cancelSuccess: "Бронирование успешно отменено",
      minutes: "минут",
      hour: "час",
      hours: "часов"
    },
    
    // Детали бронирования
    bookingDetails: {
      title: "Детали бронирования",
      bookingId: "ID бронирования",
      mentorInfo: "Информация о менторе",
      sessionDetails: "Детали сессии",
      topic: "Тема",
      notes: "Заметки",
      meetingLink: "Ссылка на встречу",
      joinMeeting: "Присоединиться к встрече",
      paymentInfo: "Информация об оплате",
      subtotal: "Подытог",
      platformFee: "Комиссия платформы",
      total: "Итого",
      paymentMethod: "Способ оплаты",
      paymentStatus: "Статус оплаты",
      paid: "Оплачено",
      pending: "В ожидании",
      actions: "Действия",
      downloadReceipt: "Скачать квитанцию",
      contactSupport: "Связаться с поддержкой"
    },
    
    // Редактирование профиля
    profileEdit: {
      title: "Редактировать профиль",
      personalInfo: "Личная информация",
      professionalInfo: "Профессиональная информация",
      accountSettings: "Настройки аккаунта",
      profilePhoto: "Фото профиля",
      changePhoto: "Изменить фото",
      firstName: "Имя",
      lastName: "Фамилия",
      email: "Email",
      phone: "Номер телефона",
      bio: "О себе",
      bioPlaceholder: "Расскажите о себе...",
      title: "Должность",
      titlePlaceholder: "например, Старший программист",
      company: "Компания",
      companyPlaceholder: "например, Google",
      expertise: "Области экспертизы",
      expertisePlaceholder: "Добавить экспертизу (нажмите Enter)",
      hourlyRate: "Почасовая ставка ($)",
      availability: "Доступность",
      monday: "Понедельник",
      tuesday: "Вторник",
      wednesday: "Среда",
      thursday: "Четверг",
      friday: "Пятница",
      saturday: "Суббота",
      sunday: "Воскресенье",
      from: "С",
      to: "До",
      changePassword: "Изменить пароль",
      currentPassword: "Текущий пароль",
      newPassword: "Новый пароль",
      confirmNewPassword: "Подтвердите новый пароль",
      notifications: "Email уведомления",
      notifyBookings: "Новые бронирования",
      notifyMessages: "Новые сообщения",
      notifyReminders: "Напоминания о сессиях",
      saveChanges: "Сохранить изменения",
      cancel: "Отмена",
      updateSuccess: "Профиль успешно обновлен",
      updateError: "Не удалось обновить профиль"
    },
    
    // Сообщения и уведомления
    messages: {
      noMessages: "Сообщений пока нет",
      typeMessage: "Введите сообщение...",
      send: "Отправить",
      online: "В сети",
      offline: "Не в сети",
      typing: "печатает..."
    },
    
    // Ошибки
    errors: {
      networkError: "Ошибка сети. Проверьте подключение.",
      serverError: "Ошибка сервера. Попробуйте позже.",
      unauthorized: "Вам нужно войти, чтобы получить доступ к этой странице.",
      notFound: "Страница не найдена.",
      forbidden: "У вас нет доступа к этому ресурсу.",
      validationError: "Проверьте введенные данные и попробуйте снова."
    }
  },
  
  ky: {
    // Навигация
    nav: {
      home: "Башкы бет",
      mentors: "Менторлорду табуу",
      bookings: "Менин брондоолорум",
      profile: "Профиль",
      logout: "Чыгуу",
      login: "Кирүү",
      register: "Каттоо"
    },
    
    // Жалпы
    common: {
      search: "Издөө",
      filter: "Чыпка",
      save: "Сактоо",
      cancel: "Жокко чыгаруу",
      edit: "Өзгөртүү",
      delete: "Өчүрүү",
      submit: "Жөнөтүү",
      back: "Артка",
      next: "Кийинки",
      loading: "Жүктөлүүдө...",
      error: "Ката",
      success: "Ийгиликтүү",
      confirm: "Ырастоо",
      viewDetails: "Толук маалымат",
      learnMore: "Көбүрөөк билүү",
      getStarted: "Баштоо"
    },
    
    // Башкы бет
    home: {
      hero: {
        title: "Өзүңүзгө Идеалдуу Менторду Табыңыз",
        subtitle: "Карьераңызда жардам берген тажрыйбалуу адистер менен байланышыңыз",
        cta: "Менторлорду көрүү",
        secondary: "Кантип иштейт"
      },
      features: {
        title: "Эмне үчүн MentorHub",
        expertMentors: {
          title: "Эксперт Менторлор",
          description: "Көп жылдык тажрыйбасы бар адистерден үйрөнүңүз"
        },
        flexibleScheduling: {
          title: "Ыңгайлуу Расписание",
          description: "Өзүңүзгө ылайыктуу убакытта сессияларды брондоңуз"
        },
        affordablePrices: {
          title: "Жеткиликтүү Баалар",
          description: "Сапаттуу насаат атаандаш бааларда"
        },
        securePayments: {
          title: "Коопсуз Төлөмдөр",
          description: "Ишенимдүү төлөм процесси"
        }
      },
      stats: {
        mentors: "Эксперт менторлор",
        students: "Активдүү студенттер",
        sessions: "Өткөрүлгөн сессиялар",
        satisfaction: "Канааттануу деңгээли"
      }
    },
    
    // Аутентификация
    auth: {
      login: {
        title: "Кош келиңиз",
        subtitle: "Аккаунтуңузга кириңиз",
        email: "Электрондук почта",
        password: "Сыр сөз",
        remember: "Мени эстеп кал",
        forgot: "Сыр сөздү унутуп калдыңызбы?",
        submit: "Кирүү",
        noAccount: "Аккаунтуңуз жокпу?",
        signUp: "Каттоо",
        orContinue: "Же улантуу"
      },
      register: {
        title: "MentorHub'ка кошулуңуз",
        subtitle: "Баштоо үчүн аккаунт түзүңүз",
        firstName: "Аты",
        lastName: "Фамилиясы",
        email: "Электрондук почта",
        password: "Сыр сөз",
        confirmPassword: "Сыр сөздү ырастаңыз",
        passwordHint: "Кеминде 8 символ болушу керек",
        role: "Мен катышкым келет",
        selectRole: "Ролду тандаңыз",
        mentee: "Менти - Мен насаатчы издеп жатам",
        mentor: "Ментор - Мен башкаларга жардам бергим келет",
        terms: "Мен макулмун",
        termsLink: "Колдонуу шарттары",
        and: "жана",
        privacyLink: "Купуялык саясаты",
        submit: "Аккаунт түзүү",
        hasAccount: "Аккаунтуңуз барбы?",
        signIn: "Кирүү",
        orSignUp: "Же каттоо"
      },
      validation: {
        emailRequired: "Email милдеттүү",
        emailInvalid: "Туура email киргизиңиз",
        passwordRequired: "Сыр сөз милдеттүү",
        passwordTooShort: "Сыр сөз кеминде 8 символдон турушу керек",
        passwordsMismatch: "Сыр сөздөр дал келбейт",
        firstNameRequired: "Аты милдеттүү",
        lastNameRequired: "Фамилиясы милдеттүү",
        roleRequired: "Ролду тандаңыз",
        termsRequired: "Колдонуу шарттарын кабыл алышыңыз керек"
      }
    },
    
    // Менторлор бети
    mentors: {
      title: "Менторуңузду табыңыз",
      searchPlaceholder: "Аты боюнча же адистиги боюнча издөө...",
      filterByCategory: "Категория боюнча чыпка",
      allCategories: "Бардык категориялар",
      filterByPrice: "Баа диапазону",
      resultsCount: "ментор табылды",
      noResults: "Менторлор табылган жок",
      noResultsDesc: "Издөөнү же чыпканы өзгөртүп көрүңүз",
      perHour: "/саат",
      rating: "Рейтинг",
      reviews: "пикирлер",
      sessions: "сессиялар",
      viewProfile: "Профилди көрүү",
      bookSession: "Брондоо",
      categories: {
        technology: "Технология",
        business: "Бизнес",
        design: "Дизайн",
        marketing: "Маркетинг",
        career: "Карьераны өнүктүрүү",
        language: "Тилдер",
        other: "Башка"
      }
    },
    
    // Ментордун профили
    profile: {
      about: "Өзү жөнүндө",
      expertise: "Адистиги",
      experience: "Тажрыйба",
      education: "Билими",
      languages: "Тилдер",
      availability: "Жеткиликтүүлүгү",
      reviews: "Пикирлер",
      rating: "Рейтинг",
      totalReviews: "Бардыгы пикирлер",
      completedSessions: "Өткөрүлгөн сессиялар",
      responseTime: "Жооп берүү убактысы",
      within24h: "24 саат ичинде",
      bookSession: "Сессияны брондоо",
      pricePerHour: "Саатына баа",
      selectDateTime: "Күн жана убакытты тандаңыз",
      writeReview: "Пикир жазуу",
      readMore: "Толук окуу",
      readLess: "Жыйыштыруу",
      showAllReviews: "Бардык пикирлерди көрсөтүү"
    },
    
    // Брондоолор бети
    bookings: {
      title: "Менин брондоолорум",
      tabs: {
        upcoming: "Алдыдагы",
        past: "Өткөн",
        cancelled: "Жокко чыгарылган"
      },
      noBookings: "Брондоолор табылган жок",
      noBookingsDesc: "Сизде али брондоолор жок",
      browseMentors: "Менторлорду көрүү",
      sessionWith: "Сессия",
      date: "Күнү",
      time: "Убактысы",
      duration: "Узактыгы",
      price: "Баасы",
      status: "Статусу",
      statusValues: {
        confirmed: "Ырасталган",
        pending: "Күтүүдө",
        completed: "Аяктаган",
        cancelled: "Жокко чыгарылган"
      },
      actions: {
        reschedule: "Көчүрүү",
        cancel: "Брондоону жокко чыгаруу",
        joinSession: "Сессияга кошулуу",
        leaveReview: "Пикир калтыруу",
        viewDetails: "Толук маалымат"
      },
      confirmCancel: "Бул брондоону жокко чыгарууну каалайсызбы?",
      cancelSuccess: "Брондоо ийгиликтүү жокко чыгарылды",
      minutes: "мүнөт",
      hour: "саат",
      hours: "саат"
    },
    
    // Брондоонун деталдары
    bookingDetails: {
      title: "Брондоонун деталдары",
      bookingId: "Брондоо ID",
      mentorInfo: "Ментор жөнүндө маалымат",
      sessionDetails: "Сессиянын деталдары",
      topic: "Тема",
      notes: "Эскертүүлөр",
      meetingLink: "Жолугушуу шилтемеси",
      joinMeeting: "Жолугушууга кошулуу",
      paymentInfo: "Төлөм жөнүндө маалымат",
      subtotal: "Аралык сумма",
      platformFee: "Платформа комиссиясы",
      total: "Жалпы",
      paymentMethod: "Төлөө ыкмасы",
      paymentStatus: "Төлөм статусу",
      paid: "Төлөнгөн",
      pending: "Күтүүдө",
      actions: "Аракеттер",
      downloadReceipt: "Квитанцияны жүктөп алуу",
      contactSupport: "Колдоо кызматы менен байланышуу"
    },
    
    // Профилди өзгөртүү
    profileEdit: {
      title: "Профилди өзгөртүү",
      personalInfo: "Жеке маалымат",
      professionalInfo: "Кесиптик маалымат",
      accountSettings: "Аккаунт жөндөөлөрү",
      profilePhoto: "Профиль сүрөтү",
      changePhoto: "Сүрөттү өзгөртүү",
      firstName: "Аты",
      lastName: "Фамилиясы",
      email: "Email",
      phone: "Телефон номери",
      bio: "Өзү жөнүндө",
      bioPlaceholder: "Өзүңүз жөнүндө айтып бериңиз...",
      title: "Кызмат орду",
      titlePlaceholder: "мисалы, Ардактуу программист",
      company: "Компания",
      companyPlaceholder: "мисалы, Google",
      expertise: "Адистик чөйрөлөрү",
      expertisePlaceholder: "Адистикти кошуу (Enter басыңыз)",
      hourlyRate: "Саатына ставка ($)",
      availability: "Жеткиликтүүлүк",
      monday: "Дүйшөмбү",
      tuesday: "Шейшемби",
      wednesday: "Шаршемби",
      thursday: "Бейшемби",
      friday: "Жума",
      saturday: "Ишемби",
      sunday: "Жекшемби",
      from: "Башталышы",
      to: "Аяктоосу",
      changePassword: "Сыр сөздү өзгөртүү",
      currentPassword: "Учурдагы сыр сөз",
      newPassword: "Жаңы сыр сөз",
      confirmNewPassword: "Жаңы сыр сөздү ырастаңыз",
      notifications: "Email билдирүүлөр",
      notifyBookings: "Жаңы брондоолор",
      notifyMessages: "Жаңы билдирүүлөр",
      notifyReminders: "Сессия эскертүүлөрү",
      saveChanges: "Өзгөртүүлөрдү сактоо",
      cancel: "Жокко чыгаруу",
      updateSuccess: "Профиль ийгиликтүү жаңыртылды",
      updateError: "Профилди жаңыртуу мүмкүн болгон жок"
    },
    
    // Билдирүүлөр жана эскертүүлөр
    messages: {
      noMessages: "Билдирүүлөр али жок",
      typeMessage: "Билдирүү жазыңыз...",
      send: "Жөнөтүү",
      online: "Онлайн",
      offline: "Офлайн",
      typing: "жазууда..."
    },
    
    // Каталар
    errors: {
      networkError: "Тармак катасы. Туташууңузду текшериңиз.",
      serverError: "Сервер катасы. Кийинчерээк аракет кылыңыз.",
      unauthorized: "Бул бетке кирүү үчүн сизге кирүү керек.",
      notFound: "Бет табылган жок.",
      forbidden: "Бул ресурска кирүүгө укугуңуз жок.",
      validationError: "Киргизилген маалыматты текшерип, кайра аракет кылыңыз."
    }
  }
};

// Helper function to get nested translation
export const getTranslation = (locale, key) => {
  const keys = key.split('.');
  let value = locales[locale];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return value || key;
};

// React Hook for using translations
export const useTranslation = (locale = 'en') => {
  const t = (key) => getTranslation(locale, key);
  return { t, locale };
};

// Language metadata
export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча' }
];

export default locales;
