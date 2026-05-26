import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

function fmtDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtList(arr) {
  if (!Array.isArray(arr) || !arr.length) return '';
  return arr.map((x) => String(x).trim()).filter(Boolean).join(', ');
}

function fmtBool(v) {
  return v ? 'Yes' : 'No';
}

function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF171717' } };
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
  row.height = 22;
}

function addKeyValueSheet(workbook, sheetName, pairs) {
  const ws = workbook.addWorksheet(sheetName.slice(0, 31));
  ws.columns = [
    { header: 'Field', key: 'field', width: 32 },
    { header: 'Value', key: 'value', width: 64 },
  ];
  styleHeaderRow(ws.getRow(1));
  pairs.forEach(([field, value]) => {
    ws.addRow({ field, value: value ?? '' });
  });
  ws.getColumn(2).alignment = { wrapText: true, vertical: 'top' };
  return ws;
}

function addTableSheet(workbook, sheetName, headers, rows) {
  const ws = workbook.addWorksheet(sheetName.slice(0, 31));
  ws.addRow(headers);
  styleHeaderRow(ws.getRow(1));
  rows.forEach((row) => ws.addRow(row));
  ws.columns = headers.map((h, i) => ({
    width: Math.min(48, Math.max(14, String(h).length + 4)),
    key: String(i),
  }));
  return ws;
}

function onboardingPairs(onboarding) {
  if (!onboarding) return [['Status', 'No onboarding record']];
  return [
    ['Phone number', onboarding.phoneNumber],
    ['Student type', onboarding.studentType],
    ['School class', onboarding.schoolClass],
    ['School stream', onboarding.schoolStream],
    ['Strongest areas', fmtList(onboarding.strongestAreas)],
    ['Learning formats', fmtList(onboarding.learningFormats)],
    ['Motivation', onboarding.motivation],
    ['Future excitement', onboarding.futureExcitement],
    ['College year', onboarding.collegeYear],
    ['College degree', onboarding.collegeDegree],
    ['Other degree', onboarding.otherDegree],
    ['Strengths', fmtList(onboarding.strengths)],
    ['Career goals', fmtList(onboarding.careerGoals)],
    ['Industries', fmtList(onboarding.industries)],
    ['Lifestyle', onboarding.lifestyle],
    ['Learning preference', fmtList(onboarding.learningPreference)],
    ['Joining reason', onboarding.joiningReason],
    ['Other reason', onboarding.otherReason],
    ['Completed at', fmtDate(onboarding.completedAt)],
  ];
}

function accountPairs(user) {
  const s = user.personalityScores || {};
  return [
    ['User ID', user.id],
    ['Name', user.name],
    ['Email', user.email],
    ['Phone', user.phone],
    ['Age', user.age ?? ''],
    ['Gender', user.gender],
    ['About', user.about],
    ['Profile picture URL', user.profilePic],
    ['Premium access', fmtBool(user.isPremium)],
    ['Onboarding complete', fmtBool(user.onboardingComplete)],
    ['Purchased courses', fmtList(user.purchasedCourses)],
    ['Joined', fmtDate(user.createdAt)],
    ['Last login', fmtDate(user.lastLogin)],
    ['Personality type', user.personalityType],
    ['Openness', s.openness],
    ['Conscientiousness', s.conscientiousness],
    ['Extraversion', s.extraversion],
    ['Agreeableness', s.agreeableness],
    ['Neuroticism', s.neuroticism],
    ['Career recommendations', fmtList(user.careerRecommendations)],
    ['Skill recommendations', fmtList(user.skillRecommendations)],
  ];
}

function futureMePairs(card) {
  if (!card) return [['Status', 'No Future Me card']];
  return [
    ['Future role', card.futureRole],
    ['Tagline', card.tagline],
    ['Mindset', card.mindset],
    ['Salary outlook', card.salary],
    ['Tags', fmtList(card.tags)],
    ['Key skills', fmtList(card.keySkills)],
    ['Mentors', fmtList(card.mentors)],
    ['Call to action', card.cta],
    ['Personality type', card.personalityType],
    ['Career paths', fmtList(card.careerRecommendations)],
    ['Skills to build', fmtList(card.skillRecommendations)],
    ['Generated', fmtDate(card.createdAt)],
  ];
}

function legacyPairs(answers) {
  if (!answers || typeof answers !== 'object') return [['Status', 'No legacy answers']];
  return Object.entries(answers).map(([k, v]) => [k, String(v ?? '')]);
}

function appendUserSheets(workbook, bundle, prefix = '') {
  const { user, onboarding, onboardingAnswers, futureMeCard } = bundle;
  const p = prefix ? `${prefix} - ` : '';

  addKeyValueSheet(workbook, `${p}Account`, accountPairs(user));
  addKeyValueSheet(workbook, `${p}Onboarding`, onboardingPairs(onboarding));
  addKeyValueSheet(workbook, `${p}Future Me`, futureMePairs(futureMeCard));
  addKeyValueSheet(workbook, `${p}Legacy`, legacyPairs(onboardingAnswers));

  addTableSheet(
    workbook,
    `${p}Experience`,
    ['Title', 'Company', 'Start', 'End', 'Current', 'Description'],
    (user.experience || []).map((e) => [
      e.title,
      e.company,
      e.startDate,
      e.endDate,
      fmtBool(e.current),
      e.description,
    ])
  );

  addTableSheet(
    workbook,
    `${p}Social`,
    ['Platform', 'URL'],
    (user.socialLinks || []).map((l) => [l.platform, l.url])
  );

  addTableSheet(
    workbook,
    `${p}Skills`,
    ['Skill', 'Progress %'],
    (user.skillsInProgress || []).map((s) => [s.name, s.progress ?? ''])
  );

  addTableSheet(
    workbook,
    `${p}Certificates`,
    ['Name', 'Organization'],
    (user.completionCertificates || []).map((c) => [c.name, c.organization])
  );

  addTableSheet(
    workbook,
    `${p}Activity`,
    ['Timestamp', 'Message'],
    (user.activityLog || []).map((a) => [fmtDate(a.timestamp), a.message])
  );
}

function buildMasterUsersSheet(workbook, bundles) {
  const headers = [
    'User ID',
    'Name',
    'Email',
    'Phone',
    'Age',
    'Gender',
    'About',
    'Premium',
    'Onboarding complete',
    'Joined',
    'Last login',
    'Purchased courses',
    'Personality type',
    'Openness',
    'Conscientiousness',
    'Extraversion',
    'Agreeableness',
    'Neuroticism',
    'Career recommendations',
    'Skill recommendations',
    'Onboarding phone',
    'Student type',
    'School class',
    'School stream',
    'College year',
    'College degree',
    'Joining reason',
    'Onboarding completed',
    'Future role',
    'Future Me tagline',
  ];

  const rows = bundles.map(({ user, onboarding, futureMeCard }) => {
    const s = user.personalityScores || {};
    return [
      user.id,
      user.name,
      user.email,
      user.phone,
      user.age ?? '',
      user.gender,
      user.about,
      fmtBool(user.isPremium),
      fmtBool(user.onboardingComplete),
      fmtDate(user.createdAt),
      fmtDate(user.lastLogin),
      fmtList(user.purchasedCourses),
      user.personalityType,
      s.openness,
      s.conscientiousness,
      s.extraversion,
      s.agreeableness,
      s.neuroticism,
      fmtList(user.careerRecommendations),
      fmtList(user.skillRecommendations),
      onboarding?.phoneNumber || '',
      onboarding?.studentType || '',
      onboarding?.schoolClass || '',
      onboarding?.schoolStream || '',
      onboarding?.collegeYear || '',
      onboarding?.collegeDegree || '',
      onboarding?.joiningReason || '',
      fmtDate(onboarding?.completedAt),
      futureMeCard?.futureRole || '',
      futureMeCard?.tagline || '',
    ];
  });

  addTableSheet(workbook, 'Users Summary', headers, rows);
}

function appendAggregateSheets(workbook, bundles) {
  const userMeta = (u) => [u.id, u.name, u.email];

  addTableSheet(
    workbook,
    'All Experience',
    ['User ID', 'Name', 'Email', 'Title', 'Company', 'Start', 'End', 'Current', 'Description'],
    bundles.flatMap(({ user }) =>
      (user.experience || []).map((e) => [
        ...userMeta(user),
        e.title,
        e.company,
        e.startDate,
        e.endDate,
        fmtBool(e.current),
        e.description,
      ])
    )
  );

  addTableSheet(
    workbook,
    'All Social Links',
    ['User ID', 'Name', 'Email', 'Platform', 'URL'],
    bundles.flatMap(({ user }) =>
      (user.socialLinks || []).map((l) => [...userMeta(user), l.platform, l.url])
    )
  );

  addTableSheet(
    workbook,
    'All Skills',
    ['User ID', 'Name', 'Email', 'Skill', 'Progress %'],
    bundles.flatMap(({ user }) =>
      (user.skillsInProgress || []).map((s) => [...userMeta(user), s.name, s.progress ?? ''])
    )
  );

  addTableSheet(
    workbook,
    'All Certificates',
    ['User ID', 'Name', 'Email', 'Certificate', 'Organization'],
    bundles.flatMap(({ user }) =>
      (user.completionCertificates || []).map((c) => [
        ...userMeta(user),
        c.name,
        c.organization,
      ])
    )
  );

  addTableSheet(
    workbook,
    'All Activity',
    ['User ID', 'Name', 'Email', 'Timestamp', 'Message'],
    bundles.flatMap(({ user }) =>
      (user.activityLog || []).map((a) => [...userMeta(user), fmtDate(a.timestamp), a.message])
    )
  );

  addTableSheet(
    workbook,
    'All Future Me',
    [
      'User ID',
      'Name',
      'Email',
      'Future role',
      'Tagline',
      'Mindset',
      'Salary',
      'Tags',
      'Key skills',
      'Mentors',
      'CTA',
      'Generated',
    ],
    bundles.flatMap(({ user, futureMeCard }) => {
      if (!futureMeCard) return [[...userMeta(user), '', '', '', '', '', '', '', '', '']];
      return [
        [
          ...userMeta(user),
          futureMeCard.futureRole,
          futureMeCard.tagline,
          futureMeCard.mindset,
          futureMeCard.salary,
          fmtList(futureMeCard.tags),
          fmtList(futureMeCard.keySkills),
          fmtList(futureMeCard.mentors),
          futureMeCard.cta,
          fmtDate(futureMeCard.createdAt),
        ],
      ];
    })
  );

  addTableSheet(
    workbook,
    'All Onboarding Full',
    [
      'User ID',
      'Name',
      'Email',
      'Phone',
      'Student type',
      'School class',
      'School stream',
      'Strongest areas',
      'Learning formats',
      'Motivation',
      'Future excitement',
      'College year',
      'College degree',
      'Other degree',
      'Strengths',
      'Career goals',
      'Industries',
      'Lifestyle',
      'Learning preference',
      'Joining reason',
      'Other reason',
      'Completed at',
    ],
    bundles.map(({ user, onboarding }) => {
      const o = onboarding || {};
      return [
        user.id,
        user.name,
        user.email,
        o.phoneNumber || '',
        o.studentType || '',
        o.schoolClass || '',
        o.schoolStream || '',
        fmtList(o.strongestAreas),
        fmtList(o.learningFormats),
        o.motivation || '',
        o.futureExcitement || '',
        o.collegeYear || '',
        o.collegeDegree || '',
        o.otherDegree || '',
        fmtList(o.strengths),
        fmtList(o.careerGoals),
        fmtList(o.industries),
        o.lifestyle || '',
        fmtList(o.learningPreference),
        o.joiningReason || '',
        o.otherReason || '',
        fmtDate(o.completedAt),
      ];
    })
  );

  const legacyRows = bundles.flatMap(({ user, onboardingAnswers }) => {
    if (!onboardingAnswers) return [];
    return Object.entries(onboardingAnswers).map(([key, value]) => [
      user.id,
      user.name,
      user.email,
      key,
      String(value ?? ''),
    ]);
  });
  if (legacyRows.length) {
    addTableSheet(workbook, 'Legacy Onboarding', ['User ID', 'Name', 'Email', 'Field', 'Value'], legacyRows);
  }
}

export async function buildUsersExcel(bundles, { singleUser = false } = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Guidopia Admin';
  workbook.created = new Date();

  if (singleUser && bundles.length === 1) {
    appendUserSheets(workbook, bundles[0]);
  } else {
    buildMasterUsersSheet(workbook, bundles);
    appendAggregateSheets(workbook, bundles);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function pdfSection(doc, title, pairs, startY) {
  let y = startY;
  doc.fontSize(12).fillColor('#111').text(title, 40, y, { underline: true });
  y += 20;
  doc.fontSize(9).fillColor('#333');

  for (const [label, value] of pairs) {
    const text = `${label}: ${value ?? ''}`;
    const h = doc.heightOfString(text, { width: 515 });
    if (y + h > doc.page.height - 50) {
      doc.addPage();
      y = 50;
    }
    doc.text(text, 40, y, { width: 515 });
    y += h + 6;
  }
  return y + 12;
}

export function buildUserPdf(bundle) {
  const { user, onboarding, onboardingAnswers, futureMeCard } = bundle;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).fillColor('#111').text('Guidopia — User Export', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666').text(`Generated: ${fmtDate(new Date())}`, { align: 'center' });
    doc.moveDown(1.2);

    let y = doc.y;
    y = pdfSection(doc, 'Account', accountPairs(user), y);
    y = pdfSection(doc, 'Onboarding', onboardingPairs(onboarding), y);
    y = pdfSection(doc, 'Future Me card', futureMePairs(futureMeCard), y);
    y = pdfSection(doc, 'Legacy onboarding answers', legacyPairs(onboardingAnswers), y);

    const tableSections = [
      [
        'Experience',
        ['Title', 'Company', 'Period', 'Description'],
        (user.experience || []).map((e) => [
          e.title,
          e.company,
          `${e.startDate || '?'} – ${e.current ? 'Present' : e.endDate || '?'}`,
          e.description,
        ]),
      ],
      [
        'Social links',
        ['Platform', 'URL'],
        (user.socialLinks || []).map((l) => [l.platform, l.url]),
      ],
      [
        'Skills in progress',
        ['Skill', 'Progress'],
        (user.skillsInProgress || []).map((s) => [s.name, s.progress != null ? `${s.progress}%` : '']),
      ],
      [
        'Certificates',
        ['Name', 'Organization'],
        (user.completionCertificates || []).map((c) => [c.name, c.organization]),
      ],
      [
        'Activity log',
        ['When', 'Message'],
        (user.activityLog || []).map((a) => [fmtDate(a.timestamp), a.message]),
      ],
    ];

    for (const [title, headers, rows] of tableSections) {
      if (!rows.length) continue;
      if (y > doc.page.height - 120) {
        doc.addPage();
        y = 50;
      }
      doc.fontSize(12).fillColor('#111').text(title, 40, y, { underline: true });
      y += 18;
      doc.fontSize(8).fillColor('#333');
      for (const row of rows) {
        const line = headers.map((h, i) => `${h}: ${row[i] ?? ''}`).join(' | ');
        const h = doc.heightOfString(line, { width: 515 });
        if (y + h > doc.page.height - 50) {
          doc.addPage();
          y = 50;
        }
        doc.text(line, 40, y, { width: 515 });
        y += h + 4;
      }
      y += 10;
    }

    doc.end();
  });
}

export function safeExportFilename(base, ext) {
  const safe = String(base || 'export')
    .replace(/[^a-z0-9._-]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  return `${safe || 'export'}.${ext}`;
}
