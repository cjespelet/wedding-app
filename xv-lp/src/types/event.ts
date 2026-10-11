export interface EventData {
  site: { title: string; description: string; url: string };
  honoree: string;
  hashtag: string;
  eventDate: string;
  hero: { eyebrow: string; title: string; subtitle: string };
  countdown: { title: string; days: string; hours: string; minutes: string; seconds: string };
  agenda: { title: string; dateLabel: string; timeLabel: string; google: string; apple: string };
  party: {
    title: string;
    venue: string;
    address: string;
    mapsUrl: string;
    mapsLabel: string;
    timeNote: string;
  };
  dressCode: { title: string; label: string; text: string };
  gifts: {
    title: string;
    text: string;
    alias: string;
    holder: string;
    copy: string;
    copied: string;
  };
  urna: { title: string; text: string };
  playlist: {
    title: string;
    text: string;
    search: string;
    ask: string;
    asking: string;
    asked: string;
    empty: string;
    spotify: string;
    url: string;
    api: string;
  };
  rsvp: {
    email: string;
    title: string;
    subtitle: string;
    name: string;
    coming: string;
    yes: string;
    no: string;
    count: string;
    phrase: string;
    submit: string;
    thanks: string;
    required: string;
    sendError: string;
    activateHint: string;
  };
  footer: { thanks: string };
}
