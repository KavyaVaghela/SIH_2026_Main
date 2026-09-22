export function getTranslatedNavTitle(
  title: string,
  t: (keyPath: string, fallback?: string) => string
): string {
  const normalized = title.trim().toLowerCase();

  switch (normalized) {
    case "home":
      return t("nav.home", title);
    case "home / overview":
    case "home overview":
      return t("nav.homeOverview", title);
    case "overview":
      return t("nav.overview", title);
    case "dashboard":
      return t("nav.dashboard", title);
    case "cooperative societies":
    case "societies":
      return t("nav.societies", title);
    case "workforce":
      return t("nav.workforce", title);
    case "kaushalgrow":
      return t("nav.learning", title);
    case "bookings":
      return t("nav.bookings", title);
    case "my bookings":
      return t("nav.myBookings", title);
    case "demand & analytics":
      return t("nav.analytics", title);
    case "worker welfare":
    case "welfare & support":
    case "welfare":
    case "welfare & development":
      return t("nav.welfare", title);
    case "complaints":
      return t("nav.complaints", title);
    case "my complaints":
      return t("nav.myComplaints", title);
    case "help & guidance":
    case "guidance":
      return t("nav.helpGuidance", title);
    case "settings":
    case "system settings":
      return t("nav.settings", title);
    case "account settings":
      return t("nav.accountSettings", title);
    case "profile":
      return t("nav.profile", title);
    case "my profile":
      return t("nav.myProfile", title);
    case "federation hub":
    case "hub":
      return t("nav.federationHub", title);
    case "federation information":
    case "federation info":
      return t("nav.federationInfo", title);
    case "worker information":
    case "worker info":
      return t("nav.workerInfo", title);
    case "workforce management":
      return t("nav.workforceManagement", title);
    case "large projects":
      return t("nav.largeProjects", title);
    case "complaint management":
      return t("nav.complaintManagement", title);
    case "emergency control":
      return t("nav.emergencyControl", title);
    case "my schedule & jobs":
    case "schedule":
      return t("nav.mySchedule", title);
    case "earnings":
      return t("nav.earnings", title);
    case "my grievances":
      return t("nav.grievances", title);
    case "find a worker":
    case "find worker":
      return t("nav.findWorker", title);
    case "payments & bills":
    case "payments":
      return t("nav.paymentsBills", title);
    case "smartserve ai":
      return t("nav.smartServe", title);
    case "cooperative members":
    case "members":
      return t("nav.cooperativeMembers", title);
    case "service bookings":
      return t("nav.serviceBookings", title);
    case "invoices & earnings":
    case "invoices":
      return t("nav.invoicesEarnings", title);
    default:
      return title;
  }
}
