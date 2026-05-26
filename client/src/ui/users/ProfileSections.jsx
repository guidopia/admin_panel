import React from 'react';
import { formatFieldValue } from '../../lib/onboardingFields.js';

function FieldRow({ label, value }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,9rem)_1fr] sm:gap-4 sm:py-0.5">
      <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-400">{label}</dt>
      <dd className="text-[13px] leading-relaxed text-neutral-800 break-words">{value}</dd>
    </div>
  );
}

function SectionCard({ title, children }) {
  if (!children) return null;
  return (
    <section className="surface-flat overflow-hidden">
      <div className="border-b border-neutral-100 bg-neutral-50/80 px-4 py-2.5">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-600">{title}</h3>
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

function ListBlock({ items, emptyLabel = 'None' }) {
  if (!items?.length) {
    return <p className="text-[13px] text-neutral-500">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li
          key={i}
          className="rounded-lg border border-neutral-100 bg-neutral-50/50 px-3 py-2 text-[13px] text-neutral-800"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function hasText(value) {
  return value != null && String(value).trim() !== '';
}

function hasArray(arr) {
  return Array.isArray(arr) && arr.length > 0;
}

export function ProfileSections({ user, futureMeCard }) {
  if (!user) return null;

  const scores = user.personalityScores || {};
  const hasPersonalityScores = Object.values(scores).some((n) => Number(n) > 0);

  const socialLinks = (user.socialLinks || []).filter((l) => hasText(l.platform) || hasText(l.url));
  const experience = user.experience || [];
  const skills = user.skillsInProgress || [];
  const certs = user.completionCertificates || [];
  const activity = (user.activityLog || []).filter((a) => hasText(a.message));

  const showAbout =
    hasText(user.about) || socialLinks.length > 0 || hasText(user.profilePic);

  const showPersonality =
    hasText(user.personalityType) ||
    hasPersonalityScores ||
    hasArray(user.careerRecommendations) ||
    hasArray(user.skillRecommendations);

  const showFutureMe =
    futureMeCard &&
    (hasText(futureMeCard.futureRole) ||
      hasText(futureMeCard.tagline) ||
      hasArray(futureMeCard.keySkills) ||
      hasArray(futureMeCard.tags));

  return (
    <>
      <SectionCard title="Account">
        <dl className="space-y-3">
          {user.profilePic ? (
            <div className="mb-3">
              <img
                src={user.profilePic}
                alt=""
                className="h-16 w-16 rounded-full border border-neutral-200 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : null}
          <FieldRow label="Name" value={user.name || '—'} />
          <FieldRow label="Email" value={user.email || '—'} />
          <FieldRow label="Phone" value={user.phone || '—'} />
          <FieldRow label="Age" value={user.age != null ? String(user.age) : '—'} />
          <FieldRow label="Gender" value={user.gender || '—'} />
          <FieldRow
            label="Joined"
            value={user.createdAt ? formatFieldValue(user.createdAt, 'date') : '—'}
          />
          <FieldRow
            label="Last login"
            value={user.lastLogin ? formatFieldValue(user.lastLogin, 'date') : '—'}
          />
          <FieldRow
            label="Purchased courses"
            value={
              hasArray(user.purchasedCourses)
                ? user.purchasedCourses.join(', ')
                : '—'
            }
          />
        </dl>
      </SectionCard>

      {showAbout ? (
        <SectionCard title="About & links">
          <dl className="space-y-3">
            {hasText(user.about) ? <FieldRow label="About" value={user.about} /> : null}
            {socialLinks.length > 0 ? (
              <div className="space-y-2">
                <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-400">
                  Social links
                </dt>
                <ul className="space-y-1.5">
                  {socialLinks.map((link, i) => (
                    <li key={i} className="text-[13px]">
                      <span className="font-medium text-neutral-700">{link.platform || 'Link'}:</span>{' '}
                      {link.url ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-900 underline decoration-neutral-300 underline-offset-2"
                        >
                          {link.url}
                        </a>
                      ) : (
                        '—'
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </dl>
        </SectionCard>
      ) : null}

      {experience.length > 0 ? (
        <SectionCard title="Experience">
          <ul className="space-y-3">
            {experience.map((exp, i) => (
              <li
                key={i}
                className="rounded-lg border border-neutral-100 bg-neutral-50/40 px-3 py-2.5"
              >
                <div className="text-[13px] font-semibold text-neutral-900">
                  {exp.title || '—'}
                  {exp.company ? (
                    <span className="font-normal text-neutral-500"> · {exp.company}</span>
                  ) : null}
                </div>
                {(exp.startDate || exp.endDate || exp.current) && (
                  <div className="mt-0.5 text-[11px] text-neutral-500">
                    {exp.startDate || '?'} — {exp.current ? 'Present' : exp.endDate || '?'}
                  </div>
                )}
                {hasText(exp.description) ? (
                  <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-700">{exp.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      {skills.length > 0 || certs.length > 0 ? (
        <SectionCard title="Skills & certificates">
          {skills.length > 0 ? (
            <div className="mb-4">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-400">
                Skills in progress
              </p>
              <ul className="space-y-2">
                {skills.map((s, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="text-neutral-800">{s.name || '—'}</span>
                    {s.progress != null ? (
                      <span className="chip-outline tabular-nums">{s.progress}%</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {certs.length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-400">
                Certificates
              </p>
              <ul className="space-y-2">
                {certs.map((c, i) => (
                  <li key={i} className="text-[13px] text-neutral-800">
                    <span className="font-medium">{c.name || '—'}</span>
                    {c.organization ? (
                      <span className="text-neutral-500"> · {c.organization}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {showPersonality ? (
        <SectionCard title="Personality & recommendations">
          <dl className="space-y-3">
            {hasText(user.personalityType) ? (
              <FieldRow label="Personality type" value={user.personalityType} />
            ) : null}
            {hasPersonalityScores ? (
              <div>
                <dt className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-400">
                  Big Five scores
                </dt>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    ['Openness', scores.openness],
                    ['Conscientiousness', scores.conscientiousness],
                    ['Extraversion', scores.extraversion],
                    ['Agreeableness', scores.agreeableness],
                    ['Neuroticism', scores.neuroticism],
                  ].map(([label, val]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-neutral-100 bg-neutral-50/60 px-2.5 py-1.5 text-center"
                    >
                      <div className="text-[10px] uppercase tracking-wide text-neutral-400">{label}</div>
                      <div className="text-[14px] font-semibold tabular-nums text-neutral-900">{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {hasArray(user.careerRecommendations) ? (
              <div>
                <dt className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-400">
                  Career recommendations
                </dt>
                <ListBlock items={user.careerRecommendations} />
              </div>
            ) : null}
            {hasArray(user.skillRecommendations) ? (
              <div>
                <dt className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-400">
                  Skill recommendations
                </dt>
                <ListBlock items={user.skillRecommendations} />
              </div>
            ) : null}
          </dl>
        </SectionCard>
      ) : null}

      {showFutureMe ? (
        <SectionCard title="Future Me card">
          <dl className="space-y-3">
            <FieldRow label="Future role" value={futureMeCard.futureRole || '—'} />
            {hasText(futureMeCard.tagline) ? (
              <FieldRow label="Tagline" value={futureMeCard.tagline} />
            ) : null}
            {hasText(futureMeCard.mindset) ? (
              <FieldRow label="Mindset" value={futureMeCard.mindset} />
            ) : null}
            {hasText(futureMeCard.salary) ? (
              <FieldRow label="Salary outlook" value={futureMeCard.salary} />
            ) : null}
            {hasArray(futureMeCard.tags) ? (
              <FieldRow label="Tags" value={futureMeCard.tags.join(', ')} />
            ) : null}
            {hasArray(futureMeCard.keySkills) ? (
              <FieldRow label="Key skills" value={futureMeCard.keySkills.join(', ')} />
            ) : null}
            {hasArray(futureMeCard.mentors) ? (
              <FieldRow label="Mentors" value={futureMeCard.mentors.join(', ')} />
            ) : null}
            {hasText(futureMeCard.cta) ? (
              <FieldRow label="Call to action" value={futureMeCard.cta} />
            ) : null}
            {hasArray(futureMeCard.careerRecommendations) ? (
              <FieldRow
                label="Career paths"
                value={futureMeCard.careerRecommendations.join(', ')}
              />
            ) : null}
            {hasArray(futureMeCard.skillRecommendations) ? (
              <FieldRow
                label="Skills to build"
                value={futureMeCard.skillRecommendations.join(', ')}
              />
            ) : null}
            {futureMeCard.createdAt ? (
              <FieldRow
                label="Generated"
                value={formatFieldValue(futureMeCard.createdAt, 'date')}
              />
            ) : null}
          </dl>
        </SectionCard>
      ) : null}

      {activity.length > 0 ? (
        <SectionCard title="Recent activity">
          <ul className="max-h-48 space-y-2 overflow-y-auto scrollbar-thin">
            {activity.map((entry, i) => (
              <li key={i} className="border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
                <p className="text-[13px] text-neutral-800">{entry.message}</p>
                {entry.timestamp ? (
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    {formatFieldValue(entry.timestamp, 'date')}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </>
  );
}
