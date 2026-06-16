import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

const sections = [
  {
    title: 'What is a Sleep Diary?',
    content: `A sleep diary is designed to gather information about your daily sleep pattern. It is necessary for you to complete your sleep diary every single day. If possible, the sleep diary should be completed within one hour of getting out of bed in the morning.`,
  },
  {
    title: 'What should I do if I miss a day?',
    content: `If you forget to fill in the diary or are unable to finish it, leave the diary blank for that day. Do not try to fill it in from memory later — inaccurate data is worse than missing data.`,
  },
  {
    title: 'What if something unusual affects my sleep?',
    content: `If your sleep or daytime functioning is affected by some unusual event (such as an illness, or an emergency) you may make brief notes on your diary in the Comments section (Q15).`,
  },
  {
    title: 'What do "bed" and "day" mean?',
    content: `This diary can be used for people who are awake or asleep at unusual times. In the sleep diary, the word "day" is the time when you choose or are required to be awake. The term "bed" means the place where you usually sleep.`,
  },
  {
    title: 'Will answering these questions affect my sleep?',
    content: `You should not worry about giving exact times, and you should not watch the clock. Give your best estimates instead of exact times. Watching the clock creates anxiety which can worsen sleep.`,
  },
];

const questions = [
  { q: 'Q1. What time did you get into bed?', a: 'Write the time that you got into bed. This may not be the time you began "trying" to fall asleep.' },
  { q: 'Q2. What time did you try to go to sleep?', a: 'Record the time you began "trying" to fall asleep.' },
  { q: 'Q3. How long did it take you to fall asleep?', a: 'Beginning at the time you wrote in question 2, how long did it take you to fall asleep? Give your best estimate by adding and subtracting; just give your best estimate.' },
  { q: 'Q4. How many times did you wake up?', a: 'How many times did you wake up, not counting your final awakening? For example, if you woke 3 times for 20 minutes, 35 minutes, and 15 minutes, add them all up (20+35+15 = 70 min).' },
  { q: 'Q5. In total, how long did these awakenings last?', a: 'What was the total time you were awake between the time you first fell asleep and your final awakening?' },
  { q: 'Q6a. What time was your final awakening?', a: 'Record the last time you woke up in the morning.' },
  { q: 'Q6b. After your final awakening, how long did you spend in bed trying to sleep?', a: 'After the last time you woke up, how many minutes did you spend in bed trying to sleep? If you woke up at 8am but continued to try and sleep until 9am, record 1 hour.' },
  { q: 'Q6c. Did you wake up earlier than you planned?', a: 'If you woke up or were awakened earlier than you had planned, check yes. If you woke up at your planned time, check no.' },
  { q: 'Q6d. If yes, how much earlier?', a: 'If you answered "yes" to question 6c, write the number of minutes you woke up earlier than you had planned. For example, if you woke up 15 minutes before your planned time, record 15 minutes.' },
  { q: 'Q7. What time did you get out of bed for the day?', a: 'What time did you get out of bed with no further attempt at sleeping? This may be different from your final awakening time (e.g. you may have woken up at 6:35am, but did not get out of bed to start your day until 7:20am).' },
  { q: 'Q9. How would you rate the quality of your sleep?', a: '"Sleep Quality" is your sense of whether your sleep was good or poor.' },
  { q: 'Q10. How rested or refreshed did you feel when you woke up?', a: 'This refers to how you felt after you were done sleeping for the night, during the first few minutes that you were awake.' },
  { q: 'Q11a & Q11b. Naps', a: 'A nap is a time you decided to sleep during the day, whether in bed or not in bed. "Dozing" is a time you may have nodded off for a few minutes, without meaning to, such as while watching TV. Count all the times you napped or dozed at any time from when you first got out of bed in the morning until you got into bed again at night. Estimate the total amount of time you spent napping or dozing, in hours and minutes. If you did not nap or doze, write "N/A".' },
  { q: 'Q12a & Q12b. Alcohol', a: 'Enter the number of alcoholic drinks you had where 1 drink is defined as one 12 oz beer (can), 5 oz wine, or 1.5 oz liquor (one shot). If you did not have an alcoholic drink, write "N/A".' },
  { q: 'Q13a & Q13b. Caffeine', a: 'Enter the number of caffeinated drinks (coffee, tea, soda, energy drinks) you had where for coffee and tea, one drink = 6-8 oz; while for caffeinated soda one drink = 12 oz. If you did not have a caffeinated drink, write "N/A".' },
  { q: 'Q14. Medication', a: 'Did you take any over-the-counter or prescription medication(s) to help you sleep? List the medication name, how much and when you took each different medication you took tonight to help you sleep. Include medication available over the counter, prescription medications, and herbals (example: "Sleepwell 50mg 11pm"). If every night is the same, write "same" after the first day.' },
  { q: 'Q15. Comments', a: 'If you have anything that you would like to say that is relevant to your sleep, feel free to write it here.' },
];

const formulas = [
  {
    name: 'Total Sleep Time (TST)',
    formula: 'TST = (Final Awakening Time - Sleep Attempt Time) - Sleep Latency (Q3) - WASO (Q5)',
    note: 'If the final awakening crosses midnight, 1440 minutes (24 hours) is added before subtracting. TST cannot be negative.',
    color: '#818cf8',
  },
  {
    name: 'Time in Bed (TIB)',
    formula: 'TIB = (Final Awakening Time (Q6a) - Sleep Attempt Time (Q2)) + Post-Awakening Bed Time (Q6b)',
    note: 'If out of bed time crosses midnight, 1440 minutes is added.',
    color: '#10b981',
  },
  {
    name: 'Sleep Efficiency (SE)',
    formula: 'SE = (Total Sleep Time ÷ Time in Bed) × 100',
    note: 'A score of 85% or above is considered clinically healthy. Below 70% may indicate insomnia or severely fragmented sleep.',
    color: '#f59e0b',
  },
];

function Accordion({ title, content }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: '1px solid rgba(16,185,129,0.12)',
      borderRadius: '12px', overflow: 'hidden', marginBottom: '8px',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: open ? 'rgba(16,185,129,0.08)' : 'rgba(15,30,24,0.4)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.15s ease',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: '500', color: '#d1fae5' }}>{title}</span>
        {open ? <ChevronUp size={16} color="#10b981" /> : <ChevronDown size={16} color="#4b5563" />}
      </button>
      {open && (
        <div style={{ padding: '16px 20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(16,185,129,0.08)' }}>
          <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.7' }}>{content}</p>
        </div>
      )}
    </div>
  );
}

export default function Instructions() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General Instructions' },
    { id: 'questions', label: 'Question Guide' },
    { id: 'formulas', label: 'How Metrics Work' },
  ];

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 28px)', maxWidth: '800px', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BookOpen size={18} color="#10b981" />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f0fdf4' }}>Instructions</h1>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Consensus Sleep Diary — Modified (CSD-M)</p>
        </div>
      </div>

      {/* Clinical note */}
      <div style={{
        padding: '14px 18px', borderRadius: '12px', marginBottom: '24px', marginTop: '16px',
        background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
      }}>
        <p style={{ fontSize: '13px', color: '#6ee7b7', lineHeight: '1.6' }}>
          <strong>Clinical instrument:</strong> The CSD-M is a validated clinical tool for tracking sleep patterns.
          Complete your diary every morning within <strong>1 hour</strong> of getting out of bed.
          Give your best estimates — do not watch the clock.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px', borderRadius: '9px', fontSize: '13px', fontWeight: '500',
              border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
              background: activeTab === tab.id ? 'rgba(16,185,129,0.2)' : 'transparent',
              color: activeTab === tab.id ? '#10b981' : '#6b7280',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'general' && (
        <div>
          {sections.map((s) => <Accordion key={s.title} title={s.title} content={s.content} />)}
        </div>
      )}

      {activeTab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {questions.map((item) => (
            <div key={item.q} style={{
              background: 'rgba(15,30,24,0.6)', border: '1px solid rgba(16,185,129,0.1)',
              borderRadius: '12px', padding: '16px 20px',
            }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#10b981', marginBottom: '6px' }}>{item.q}</p>
              <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.7' }}>{item.a}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'formulas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
            All metrics are calculated using validated CSD-M formulas. No AI or estimation is involved — pure math from your inputs.
          </p>
          {formulas.map((f) => (
            <div key={f.name} style={{
              background: 'rgba(15,30,24,0.6)',
              border: `1px solid ${f.color}20`,
              borderRadius: '16px', padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.color }} />
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: f.color }}>{f.name}</h3>
              </div>
              <div style={{
                padding: '12px 16px', borderRadius: '10px', marginBottom: '10px',
                background: 'rgba(0,0,0,0.3)', border: `1px solid ${f.color}15`,
                fontFamily: 'monospace', fontSize: '13px', color: '#d1fae5',
              }}>
                {f.formula}
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>{f.note}</p>
            </div>
          ))}

          {/* SE thresholds */}
          <div style={{
            background: 'rgba(15,30,24,0.6)', border: '1px solid rgba(16,185,129,0.1)',
            borderRadius: '16px', padding: '20px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#d1fae5', marginBottom: '14px' }}>
              Sleep Efficiency Thresholds
            </h3>
            {[
              { range: '≥ 85%', label: 'Healthy', color: '#10b981', desc: 'Clinically normal sleep efficiency' },
              { range: '70–84%', label: 'Fair', color: '#f59e0b', desc: 'Mildly reduced — worth monitoring' },
              { range: '< 70%', label: 'Poor', color: '#ef4444', desc: 'May indicate insomnia or fragmented sleep — discuss with clinician' },
            ].map(({ range, label, color, desc }) => (
              <div key={range} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '10px 0', borderBottom: '1px solid rgba(16,185,129,0.06)',
              }}>
                <div style={{ width: '60px', flexShrink: 0 }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color }}>{range}</span>
                </div>
                <div style={{
                  width: '60px', flexShrink: 0,
                  padding: '2px 8px', borderRadius: '6px',
                  background: `${color}15`, border: `1px solid ${color}30`,
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color }}>{label}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}