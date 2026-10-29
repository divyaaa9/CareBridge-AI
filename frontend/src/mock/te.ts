// Demo-only Telugu strings so the English/Telugu switch works without a backend.
// In production the backend /api/translate endpoint (LLM) generates these from the same structured plan.
export const TE: Record<string, string> = {
  'Home': 'హోమ్', 'My Care Plan': 'నా సంరక్షణ ప్రణాళిక', 'Care Plan': 'సంరక్షణ ప్రణాళిక', 'Medicines': 'మందులు', 'Recovery': 'కోలుకోవడం',
  'Appointments': 'అపాయింట్‌మెంట్లు', 'Records': 'రికార్డులు', 'Ask CareBridge': 'CareBridge ని అడగండి', 'Upload': 'అప్‌లోడ్',
  'Family & sharing': 'కుటుంబం & షేరింగ్', 'Profile & Settings': 'ప్రొఫైల్ & సెట్టింగ్స్', 'Settings': 'సెట్టింగ్స్', 'More': 'మరిన్ని',
  'Good morning': 'శుభోదయం', 'Good afternoon': 'శుభ మధ్యాహ్నం', 'Good evening': 'శుభ సాయంత్రం', "Today's plan": 'నేటి ప్రణాళిక',
  'Taken': 'తీసుకున్నారు', 'Due': 'తీసుకోవాలి', 'Missed': 'మిస్ అయింది', 'Late': 'ఆలస్యం', 'Skipped': 'వదిలేశారు', 'Unsure': 'తెలియదు',
  'Needs Clarification': 'స్పష్టత అవసరం', 'Ready to Use': 'వినియోగానికి సిద్ధం', 'Validation Failed': 'ధృవీకరణ విఫలమైంది', 'Draft': 'ముసాయిదా',
  'Sign in': 'సైన్ ఇన్', 'Sign out': 'సైన్ అవుట్', 'Get started': 'ప్రారంభించండి', 'Language': 'భాష',
  'Morning': 'ఉదయం', 'Afternoon': 'మధ్యాహ్నం', 'Evening': 'సాయంత్రం', 'Night': 'రాత్రి',
  'Before food': 'భోజనానికి ముందు', 'After food': 'భోజనం తర్వాత', 'Warning signs': 'హెచ్చరిక సంకేతాలు',
  'Seek medical help immediately if you have: {w}': 'మీకు ఇవి ఉంటే వెంటనే వైద్య సహాయం తీసుకోండి: {w}',
  'fever or breathing difficulty': 'జ్వరం లేదా శ్వాస తీసుకోవడంలో ఇబ్బంది', 'in 2 weeks': '2 వారాల తర్వాత', 'Follow-up': 'ఫాలో-అప్',
  'Not Booked': 'బుక్ కాలేదు', 'Request Pending': 'అభ్యర్థన పెండింగ్', 'Confirmed': 'ధృవీకరించబడింది', 'Completed': 'పూర్తయింది',
  'Recovery progress': 'రికవరీ పురోగతి', 'Day {n} of {m} · Your recovery plan': 'రోజు {n} / {m} · మీ రికవరీ ప్రణాళిక',
  'From hospital discharge to': 'ఆసుపత్రి నుండి ఇంటికి', 'confident recovery.': 'ఆత్మవిశ్వాసంతో కోలుకోవడం.',
  'Missed a dose?': 'మోతాదు మిస్ అయ్యారా?', 'Never double a dose': 'మోతాదును ఎప్పుడూ రెట్టింపు చేయవద్దు', 'Source': 'మూలం',
  'Save': 'సేవ్ చేయండి', 'Cancel': 'రద్దు చేయండి', 'Close': 'మూసివేయండి', 'Pain {n}/10': 'నొప్పి {n}/10', 'Medicine': 'మందు', 'When': 'ఎప్పుడు',
  'Upload document': 'పత్రాన్ని అప్‌లోడ్ చేయండి', 'Open plan': 'ప్రణాళిక తెరవండి', 'Next visit': 'తదుపరి సందర్శన', "Today's doses": 'నేటి మోతాదులు',
}
