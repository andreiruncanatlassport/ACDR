interface Dictionary {
  mobileNav: {
    home: string;
    companies: string;
    members: string;
    projects: string;
    messages: string;
    account: string;
    login: string;
  };
  nav: {
    catalog: string;
    opportunities: string;
    members: string;
    news: string;
    events: string;
    messages: string;
    howItWorks: string;
    login: string;
    register: string;
    dashboard: string;
    admin: string;
    logout: string;
    circles: string;
    fiscalCalendar: string;
  };
  home: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    titleRest: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stampLabel: string;
    eventsEyebrow: string;
    eventsTitle: string;
    eventsSeeAll: string;
    eventsEmpty: string;
    newsEyebrow: string;
    newsTitle: string;
    newsSeeAll: string;
    newsEmpty: string;
    howTitle: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    trustEyebrow: string;
    trustTitle: string;
    trust1: string;
    trust2: string;
    trust3: string;
    ctaFinalTitle: string;
    ctaFinalBody: string;
    quickNavTitle: string;
    quickNavFirme: string;
    quickNavMembri: string;
    quickNavOportunitati: string;
    quickNavEvenimente: string;
    quickNavStiri: string;
    companiesEyebrow: string;
    companiesTitle: string;
    companiesSeeAll: string;
    companiesExploreButton: string;
    companiesEmpty: string;
    opportunitiesEyebrow: string;
    opportunitiesTitle: string;
    opportunitiesSeeAll: string;
    opportunitiesEmpty: string;
  };
  footer: {
    tagline: string;
    dataSource: string;
  };
  company: {
    cui: string;
    denumire: string;
    adresa: string;
    judet: string;
    localitate: string;
    status_pending: string;
    status_approved: string;
    status_rejected: string;
    status_suspended: string;
    tvaActiv: string;
    tvaInactiv: string;
    angajati: string;
    cifraAfaceri: string;
    website: string;
    contact: string;
    descriere: string;
    domenii: string;
    zonaDeservita: string;
    cerereConexiune: string;
    conexiuneTrimisa: string;
    conexiuneAcceptata: string;
  };
  catalog: {
    eyebrow: string;
    title: string;
    countSuffix: string;
    sortedByDistance: string;
    searchPlaceholder: string;
    noResultsTitle: string;
    noResultsBody: string;
  };
  news: {
    eyebrow: string;
    title: string;
    subtitle: string;
    empty: string;
    readMore: string;
    allNews: string;
  };
  events: {
    eyebrow: string;
    title: string;
    subtitle: string;
    empty: string;
    pastEvents: string;
    allEvents: string;
    register: string;
    unregister: string;
    full: string;
    seatsLeft: string;
    online: string;
    externalLink: string;
    typeConference: string;
    typeWorkshop: string;
    typeNetworking: string;
    typeOther: string;
    cancelled: string;
  };
  members: {
    eyebrow: string;
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    empty: string;
    emptySearch: string;
    sendMessage: string;
    allMembers: string;
  };
  messages: {
    title: string;
    empty: string;
    emptyCta: string;
    selectConversation: string;
    typePlaceholder: string;
    startConversation: string;
    send: string;
    cancel: string;
    export: string;
    delete: string;
    deleteConfirm: string;
    conversationWith: string;
  };
  opportunities: {
    eyebrow: string;
    title: string;
    subtitle: string;
    postNew: string;
    empty: string;
    filterAll: string;
    typeProject: string;
    typePurchase: string;
    typeCollaboration: string;
    typeServiceRequest: string;
    closed: string;
    responseSingular: string;
    responses: string;
    respond: string;
    alreadyResponded: string;
    loginToRespond: string;
    needCompany: string;
    close: string;
    reopen: string;
    imageOptional: string;
    imageHint: string;
    allOpportunities: string;
    responsesLabel: string;
    noResponses: string;
    companyFallback: string;
    until: string;
    loginLink: string;
    registerLink: string;
    alreadyRespondedContact: string;
    respondPrompt: string;
    estimatedPrice: string;
    responsePlaceholder: string;
    respondError: string;
    loginToRespondSuffix: string;
    loginToPostSuffix: string;
    postSubtitle: string;
    sectionAbout: string;
    fieldTitle: string;
    titlePlaceholder: string;
    fieldDescription: string;
    descriptionPlaceholder: string;
    fieldType: string;
    addImage: string;
    removeImage: string;
    sectionDetails: string;
    fieldDomain: string;
    anyDomain: string;
    fieldCounty: string;
    anywhere: string;
    fieldBudgetMin: string;
    fieldBudgetMax: string;
    fieldDeadline: string;
    deadlineHint: string;
    publish: string;
  };
  auth: {
    email: string;
    parola: string;
    numeComplet: string;
    telefon: string;
    login: string;
    register: string;
    noAccount: string;
    hasAccount: string;
  };
  common: {
    loading: string;
    save: string;
    cancel: string;
    next: string;
    back: string;
    search: string;
    filters: string;
    noResults: string;
    required: string;
    optional: string;
    send: string;
    delete: string;
    edit: string;
    export: string;
    archive: string;
    unarchive: string;
  };
}

export const translations: Record<"ro" | "en", Dictionary> = {
  ro: {
    mobileNav: {
      home: "Acasă",
      companies: "Firme",
      members: "Membri",
      projects: "Proiecte",
      messages: "Mesaje",
      account: "Cont",
      login: "Intră",
    },
    nav: {
      catalog: "Catalog firme",
      opportunities: "Oportunități",
      members: "Membri",
      news: "Știri",
      events: "Evenimente",
      messages: "Mesaje",
      howItWorks: "Cum funcționează",
      login: "Autentificare",
      register: "Creează cont",
      dashboard: "Contul meu",
      admin: "Administrare",
      logout: "Deconectare",
      circles: "Cercuri",
      fiscalCalendar: "Calendar fiscal",
    },
    home: {
      eyebrow: "Comunitatea Antreprenorilor Creștini",
      title: "Antreprenori Creștini din România",
      titleAccent: "Antreprenori Creștini",
      titleRest: "din România",
      subtitle:
        "Comunitatea Antreprenorilor Creștini — locul unde antreprenorii cu aceleași valori se găsesc unii pe alții, colaborează și cresc împreună. Firme verificate prin ANAF, oportunități, mesaje directe și evenimente, toate într-un singur loc.",
      ctaPrimary: "Creează-ți contul gratuit",
      ctaSecondary: "Caută în catalog",
      stampLabel: "Verificat prin ANAF",
      eventsEyebrow: "Ce urmează",
      eventsTitle: "Evenimente",
      eventsSeeAll: "Toate evenimentele →",
      eventsEmpty: "Niciun eveniment programat momentan.",
      newsEyebrow: "Comunitatea",
      newsTitle: "Știri",
      newsSeeAll: "Toate știrile →",
      newsEmpty: "Nicio știre publicată momentan.",
      howTitle: "Trei pași până la primul colaborator",
      step1Title: "Înregistrează-ți firma",
      step1Body: "Completezi CUI-ul, restul datelor se preiau automat de la ANAF.",
      step2Title: "Explorează comunitatea",
      step2Body: "Catalog de firme, membri, oportunități deschise și știri din comunitate.",
      step3Title: "Colaborează",
      step3Body: "Trimiți mesaje, răspunzi la oportunități și construiești parteneriate.",
      trustEyebrow: "Diferența",
      trustTitle: "O comunitate, nu doar un catalog",
      trust1: "Fiecare firmă e verificată prin ANAF înainte să apară public în catalog.",
      trust2: "Datele personale ale reprezentanților rămân private — vizibile doar prin conexiune sau mesaj direct.",
      trust3: "Membri, oportunități și evenimente reale, nu doar un formular de contact.",
      ctaFinalTitle: "Gata să-ți găsești următorul colaborator?",
      ctaFinalBody: "Înregistrarea durează câteva minute. Datele firmei se preiau automat de la ANAF.",
      quickNavTitle: "Explorează comunitatea",
      quickNavFirme: "Firme",
      quickNavMembri: "Membri",
      quickNavOportunitati: "Oportunități",
      quickNavEvenimente: "Evenimente",
      quickNavStiri: "Știri",
      companiesEyebrow: "Din catalog",
      companiesTitle: "Firme din comunitate",
      companiesSeeAll: "Vezi toate firmele →",
      companiesExploreButton: "Explorează lista firmelor înregistrate",
      companiesEmpty: "Nicio firmă înregistrată momentan.",
      opportunitiesEyebrow: "Piața",
      opportunitiesTitle: "Oportunități",
      opportunitiesSeeAll: "Toate oportunitățile →",
      opportunitiesEmpty: "Nicio oportunitate deschisă momentan.",
    },
    footer: {
      tagline: "Registrul antreprenorilor din România — găsește colaboratori verificați, în orice domeniu.",
      dataSource: "Datele firmelor sunt preluate din surse publice oficiale (ANAF).",
    },
    company: {
      cui: "CUI",
      denumire: "Denumire firmă",
      adresa: "Adresă sediu",
      judet: "Județ",
      localitate: "Localitate",
      status_pending: "În verificare",
      status_approved: "Verificată",
      status_rejected: "Respinsă",
      status_suspended: "Suspendată",
      tvaActiv: "Plătitor de TVA",
      tvaInactiv: "Neplătitor de TVA",
      angajati: "Nr. angajați",
      cifraAfaceri: "Cifră de afaceri",
      website: "Website",
      contact: "Contact",
      descriere: "Descriere",
      domenii: "Domenii de activitate",
      zonaDeservita: "Zonă deservită",
      cerereConexiune: "Trimite cerere de conexiune",
      conexiuneTrimisa: "Cerere trimisă",
      conexiuneAcceptata: "Conectat",
    },
    catalog: {
      eyebrow: "Registrul firmelor",
      title: "Catalog firme",
      countSuffix: "firme verificate prin ANAF",
      sortedByDistance: "sortate după distanță",
      searchPlaceholder: "Caută după nume, descriere sau domeniu...",
      noResultsTitle: "Nicio firmă găsită",
      noResultsBody: "Încearcă să lărgești căutarea — mai puține filtre, sau o rază geografică mai mare.",
    },
    news: {
      eyebrow: "Comunitatea",
      title: "Știri",
      subtitle: "Articole, interviuri și noutăți din comunitatea ACDR.",
      empty: "Nicio știre publicată momentan.",
      readMore: "Citește știrea",
      allNews: "Toate știrile",
    },
    events: {
      eyebrow: "Ce urmează",
      title: "Evenimente",
      subtitle: "Conferințe, workshop-uri și întâlniri de networking ale comunității.",
      empty: "Niciun eveniment programat momentan.",
      pastEvents: "Evenimente trecute",
      allEvents: "Toate evenimentele",
      register: "Înscrie-te la eveniment",
      unregister: "Anulează înscrierea",
      full: "Locuri epuizate",
      seatsLeft: "locuri",
      online: "Online",
      externalLink: "Link către eveniment",
      typeConference: "Conferință",
      typeWorkshop: "Workshop",
      typeNetworking: "Networking",
      typeOther: "Eveniment",
      cancelled: "Anulat",
    },
    members: {
      eyebrow: "Directorul comunității",
      title: "Membri",
      subtitle: "Antreprenori și profesioniști din comunitatea ACDR. Trimite un mesaj direct oricui.",
      searchPlaceholder: "Caută după nume, firmă sau titlu...",
      empty: "Niciun membru public momentan.",
      emptySearch: "Niciun membru găsit pentru această căutare.",
      sendMessage: "Trimite mesaj",
      allMembers: "Toți membrii",
    },
    messages: {
      title: "Mesaje",
      empty: "Nicio conversație încă.",
      emptyCta: "Caută membri și trimite primul mesaj",
      selectConversation: "Alege o conversație din stânga, sau pornește una nouă din pagina de Membri.",
      typePlaceholder: "Scrie un mesaj...",
      startConversation: "Începe conversația — scrie primul mesaj mai jos.",
      send: "Trimite",
      cancel: "Anulează",
      export: "Exportă conversația",
      delete: "Șterge conversația",
      deleteConfirm: "Ștergi această conversație din lista ta? Celălalt membru o păstrează pe a lui.",
      conversationWith: "Mesaj către",
    },
    opportunities: {
      eyebrow: "Board public",
      title: "Oportunități",
      subtitle: "Proiecte, achiziții, colaborări și cereri de servicii postate de membri. Orice firmă verificată poate răspunde.",
      postNew: "Postează o oportunitate",
      empty: "Nicio oportunitate deschisă momentan.",
      filterAll: "Toate",
      typeProject: "Proiect",
      typePurchase: "Achiziție",
      typeCollaboration: "Colaborare",
      typeServiceRequest: "Cerere de servicii",
      closed: "Închisă",
      responseSingular: "răspuns",
      responses: "răspunsuri",
      respond: "Trimite răspunsul",
      alreadyResponded: "Ai răspuns deja la această oportunitate.",
      loginToRespond: "Autentifică-te ca să răspunzi la această oportunitate.",
      needCompany: "Trebuie să ai o firmă verificată ca să răspunzi.",
      close: "Închide oportunitatea",
      reopen: "Redeschide",
      imageOptional: "Imagine (opțional)",
      imageHint: "Recomandăm 1200×675px (format 16:9), sub 5MB. Nu e obligatoriu, iar dacă dimensiunea diferă puțin, nu e o problemă.",
      allOpportunities: "Toate oportunitățile",
      responsesLabel: "Răspunsuri",
      noResponses: "Niciun răspuns încă.",
      companyFallback: "Firmă",
      until: "până la",
      loginLink: "Autentifică-te",
      registerLink: "Înregistrează-ți firma",
      alreadyRespondedContact: "Ai răspuns deja la această oportunitate. Firma care a postat te va contacta.",
      respondPrompt: "Răspunde la această oportunitate",
      estimatedPrice: "Preț estimat (€, opțional)",
      responsePlaceholder: "Descrie pe scurt cum poți ajuta, experiența relevantă...",
      respondError: "Scrie un mesaj pentru firma care a postat oportunitatea.",
      loginToRespondSuffix: "ca să răspunzi la această oportunitate.",
      loginToPostSuffix: "ca să postezi o oportunitate.",
      postSubtitle: "Vizibilă tuturor firmelor din ACDR, până când o închizi. Diferă de o Cerere de ofertă (trimisă privat către firme alese de tine) — aici oricine poate răspunde.",
      sectionAbout: "Despre ce e vorba",
      fieldTitle: "Titlu",
      titlePlaceholder: "Ex: Caut subcontractor instalații electrice",
      fieldDescription: "Descriere",
      descriptionPlaceholder: "Detaliază nevoia, contextul, ce aștepți de la colaborare...",
      fieldType: "Tip",
      addImage: "Adaugă o imagine",
      removeImage: "Elimină imaginea",
      sectionDetails: "Detalii (opțional)",
      fieldDomain: "Domeniu",
      anyDomain: "Oricare",
      fieldCounty: "Județ",
      anywhere: "Oriunde",
      fieldBudgetMin: "Buget minim (€)",
      fieldBudgetMax: "Buget maxim (€)",
      fieldDeadline: "Termen limită",
      deadlineHint: "Data până la care aștepți răspunsuri.",
      publish: "Publică oportunitatea",
    },
    auth: {
      email: "Email",
      parola: "Parolă",
      numeComplet: "Nume complet",
      telefon: "Telefon",
      login: "Autentificare",
      register: "Creează cont",
      noAccount: "Nu ai cont?",
      hasAccount: "Ai deja cont?",
    },
    common: {
      loading: "Se încarcă...",
      save: "Salvează",
      cancel: "Anulează",
      next: "Continuă",
      back: "Înapoi",
      search: "Caută",
      filters: "Filtre",
      noResults: "Nicio firmă găsită pentru filtrele alese.",
      required: "Câmp obligatoriu",
      optional: "opțional",
      send: "Trimite",
      delete: "Șterge",
      edit: "Editează",
      export: "Exportă",
      archive: "Arhivează",
      unarchive: "Dezarhivează",
    },
  },
  en: {
    mobileNav: {
      home: "Home",
      companies: "Companies",
      members: "Members",
      projects: "Projects",
      messages: "Messages",
      account: "Account",
      login: "Log in",
    },
    nav: {
      catalog: "Company catalog",
      opportunities: "Opportunities",
      members: "Members",
      news: "News",
      events: "Events",
      messages: "Messages",
      howItWorks: "How it works",
      login: "Log in",
      register: "Create account",
      dashboard: "My account",
      admin: "Admin",
      logout: "Log out",
      circles: "Circles",
      fiscalCalendar: "Tax calendar",
    },
    home: {
      eyebrow: "The Christian Entrepreneurs Community",
      title: "Christian Entrepreneurs of Romania",
      titleAccent: "Christian Entrepreneurs",
      titleRest: "of Romania",
      subtitle:
        "The Christian Entrepreneurs Community — where entrepreneurs who share the same values find each other, collaborate, and grow together. ANAF-verified companies, opportunities, direct messages and events, all in one place.",
      ctaPrimary: "Create your free account",
      ctaSecondary: "Browse the catalog",
      stampLabel: "Verified via ANAF",
      eventsEyebrow: "Coming up",
      eventsTitle: "Events",
      eventsSeeAll: "All events →",
      eventsEmpty: "No events scheduled right now.",
      newsEyebrow: "Community",
      newsTitle: "News",
      newsSeeAll: "All news →",
      newsEmpty: "No news published yet.",
      howTitle: "Three steps to your first collaborator",
      step1Title: "Register your company",
      step1Body: "Enter your tax ID (CUI) — the rest of the data is pulled automatically from ANAF.",
      step2Title: "Explore the community",
      step2Body: "Company catalog, members, open opportunities, and community news.",
      step3Title: "Collaborate",
      step3Body: "Send messages, respond to opportunities, and build partnerships.",
      trustEyebrow: "The difference",
      trustTitle: "A community, not just a catalog",
      trust1: "Every company is verified via ANAF before it appears publicly in the catalog.",
      trust2: "Representatives' personal data stays private — visible only via a connection or direct message.",
      trust3: "Real members, opportunities, and events — not just a contact form.",
      ctaFinalTitle: "Ready to find your next collaborator?",
      ctaFinalBody: "Registration takes a few minutes. Company data is pulled automatically from ANAF.",
      quickNavTitle: "Explore the community",
      quickNavFirme: "Companies",
      quickNavMembri: "Members",
      quickNavOportunitati: "Opportunities",
      quickNavEvenimente: "Events",
      quickNavStiri: "News",
      companiesEyebrow: "From the catalog",
      companiesTitle: "Companies in the community",
      companiesSeeAll: "See all companies →",
      companiesExploreButton: "Explore the list of registered companies",
      companiesEmpty: "No companies registered yet.",
      opportunitiesEyebrow: "Marketplace",
      opportunitiesTitle: "Opportunities",
      opportunitiesSeeAll: "All opportunities →",
      opportunitiesEmpty: "No open opportunities right now.",
    },
    footer: {
      tagline: "Romania's entrepreneur registry — find verified collaborators, in any field.",
      dataSource: "Company data is sourced from official public records (ANAF).",
    },
    company: {
      cui: "Tax ID (CUI)",
      denumire: "Company name",
      adresa: "Registered address",
      judet: "County",
      localitate: "City",
      status_pending: "Under review",
      status_approved: "Verified",
      status_rejected: "Rejected",
      status_suspended: "Suspended",
      tvaActiv: "VAT registered",
      tvaInactiv: "Not VAT registered",
      angajati: "Employees",
      cifraAfaceri: "Annual revenue",
      website: "Website",
      contact: "Contact",
      descriere: "Description",
      domenii: "Fields of activity",
      zonaDeservita: "Service area",
      cerereConexiune: "Send connection request",
      conexiuneTrimisa: "Request sent",
      conexiuneAcceptata: "Connected",
    },
    catalog: {
      eyebrow: "Company registry",
      title: "Company catalog",
      countSuffix: "companies verified via ANAF",
      sortedByDistance: "sorted by distance",
      searchPlaceholder: "Search by name, description or field...",
      noResultsTitle: "No companies found",
      noResultsBody: "Try widening your search — fewer filters, or a larger geographic radius.",
    },
    news: {
      eyebrow: "Community",
      title: "News",
      subtitle: "Articles, interviews and news from the ACDR community.",
      empty: "No news published yet.",
      readMore: "Read the article",
      allNews: "All news",
    },
    events: {
      eyebrow: "Coming up",
      title: "Events",
      subtitle: "Conferences, workshops and networking gatherings for the community.",
      empty: "No events scheduled right now.",
      pastEvents: "Past events",
      allEvents: "All events",
      register: "Register for this event",
      unregister: "Cancel registration",
      full: "Fully booked",
      seatsLeft: "seats",
      online: "Online",
      externalLink: "Event link",
      typeConference: "Conference",
      typeWorkshop: "Workshop",
      typeNetworking: "Networking",
      typeOther: "Event",
      cancelled: "Cancelled",
    },
    members: {
      eyebrow: "Community directory",
      title: "Members",
      subtitle: "Entrepreneurs and professionals from the ACDR community. Message anyone directly.",
      searchPlaceholder: "Search by name, company or title...",
      empty: "No public members right now.",
      emptySearch: "No members found for this search.",
      sendMessage: "Send message",
      allMembers: "All members",
    },
    messages: {
      title: "Messages",
      empty: "No conversations yet.",
      emptyCta: "Find members and send the first message",
      selectConversation: "Pick a conversation on the left, or start a new one from the Members page.",
      typePlaceholder: "Type a message...",
      startConversation: "Start the conversation — write the first message below.",
      send: "Send",
      cancel: "Cancel",
      export: "Export conversation",
      delete: "Delete conversation",
      deleteConfirm: "Delete this conversation from your list? The other member keeps theirs.",
      conversationWith: "Message to",
    },
    opportunities: {
      eyebrow: "Public board",
      title: "Opportunities",
      subtitle: "Projects, purchases, collaborations and service requests posted by members. Any verified company can respond.",
      postNew: "Post an opportunity",
      empty: "No open opportunities right now.",
      filterAll: "All",
      typeProject: "Project",
      typePurchase: "Purchase",
      typeCollaboration: "Collaboration",
      typeServiceRequest: "Service request",
      closed: "Closed",
      responseSingular: "response",
      responses: "responses",
      respond: "Send response",
      alreadyResponded: "You've already responded to this opportunity.",
      loginToRespond: "Log in to respond to this opportunity.",
      needCompany: "You need a verified company to respond.",
      close: "Close opportunity",
      reopen: "Reopen",
      imageOptional: "Image (optional)",
      imageHint: "We recommend 1200×675px (16:9), under 5MB. Not required — if the size differs a bit, that's fine.",
      allOpportunities: "All opportunities",
      responsesLabel: "Responses",
      noResponses: "No responses yet.",
      companyFallback: "Company",
      until: "until",
      loginLink: "Log in",
      registerLink: "Register your company",
      alreadyRespondedContact: "You've already responded to this opportunity. The company that posted it will reach out.",
      respondPrompt: "Respond to this opportunity",
      estimatedPrice: "Estimated price (€, optional)",
      responsePlaceholder: "Briefly describe how you can help, relevant experience...",
      respondError: "Write a message for the company that posted this opportunity.",
      loginToRespondSuffix: "to respond to this opportunity.",
      loginToPostSuffix: "to post an opportunity.",
      postSubtitle: "Visible to every company in ACDR, until you close it. Different from a Request for Quote (sent privately to companies you choose) — here, anyone can respond.",
      sectionAbout: "What it's about",
      fieldTitle: "Title",
      titlePlaceholder: "E.g. Looking for an electrical subcontractor",
      fieldDescription: "Description",
      descriptionPlaceholder: "Detail the need, context, what you expect from the collaboration...",
      fieldType: "Type",
      addImage: "Add an image",
      removeImage: "Remove image",
      sectionDetails: "Details (optional)",
      fieldDomain: "Field",
      anyDomain: "Any",
      fieldCounty: "County",
      anywhere: "Anywhere",
      fieldBudgetMin: "Minimum budget (€)",
      fieldBudgetMax: "Maximum budget (€)",
      fieldDeadline: "Deadline",
      deadlineHint: "Date until which you expect responses.",
      publish: "Publish opportunity",
    },
    auth: {
      email: "Email",
      parola: "Password",
      numeComplet: "Full name",
      telefon: "Phone",
      login: "Log in",
      register: "Create account",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
    },
    common: {
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      next: "Continue",
      back: "Back",
      search: "Search",
      filters: "Filters",
      noResults: "No companies match the selected filters.",
      required: "Required field",
      optional: "optional",
      send: "Send",
      delete: "Delete",
      edit: "Edit",
      export: "Export",
      archive: "Archive",
      unarchive: "Unarchive",
    },
  },
};

export type Locale = keyof typeof translations;
export type TranslationShape = Dictionary;
