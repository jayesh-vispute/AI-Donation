import React from 'react';
import { Sparkles, Brain, CheckCircle, AlertCircle, Box, BookOpen, Shirt, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/common/LanguageSelector';
import './Home.css';

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className="donation-landing">
      <header className="nav">
        <div className="nav-inner">
          <div className="logo">
            <div className="logo-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.1 2.3 4 6.3 4c2.2 0 3.9 1.2 5.7 3.3C13.8 5.2 15.5 4 17.7 4c4 0 5.9 4.1 4.3 7.7C19.5 16.4 12 21 12 21z" fill="white" /></svg>
            </div>
            <div className="logo-text">
              <strong>Donation AI</strong>
              <span>{t('home.footerTagline', 'Give smarter, create bigger impact')}</span>
            </div>
          </div>
          <nav className="links">
            <a href="#">{t('common.home', 'Home')}</a>
            <a href="#how">{t('home.footerHowItWorks', 'How it works')}</a>
            <a href="#detection">{t('home.footerAiDetection', 'AI detection')}</a>
            <a href="#ngos">{t('home.footerNgos', 'NGOs')}</a>
            <a href="#impact">{t('home.footerImpact', 'Impact')}</a>
          </nav>
          <div className="nav-actions">
            <LanguageSelector />
            <Link to="/login" className="action-btn action-btn-ghost">{t('actions.signIn', 'Sign in')}</Link>
            <Link to="/register" className="action-btn action-btn-primary">{t('home.startDonating', 'Get started')}</Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow"><span className="dot"></span> {t('home.heroEyebrow', 'AI-powered donation matching')}</div>
            <h1>{t('home.heroTitle', 'Turn what you don\'t need into what someone needs')}</h1>
            <p className="lede">{t('home.heroLede', 'Point your camera at items you no longer use. Donation AI identifies them, finds the NGO that needs them most, and tracks every step until they arrive.')}</p>
            <div className="hero-ctas">
              <Link to="/register" className="action-btn action-btn-primary">{t('home.startDonating', 'Start donating')}</Link>
              <a href="#how" className="action-btn" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>{t('home.footerHowItWorks', 'See how it works')}</a>
            </div>
            <div className="trust-row">
              <div className="trust-item"><span className="ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#8FCBA3" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="12" r="9" stroke="#8FCBA3" strokeWidth="1.6" /></svg></span>{t('home.trust1', '180+ verified NGOs')}</div>
              <div className="trust-item"><span className="ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 16.3 6.8 19l1-5.8-4.3-4.1 5.9-.8L12 3z" stroke="#C4B4EE" strokeWidth="1.4" strokeLinejoin="round" /></svg></span>{t('home.trust2', 'Confidence-scored detection')}</div>
              <div className="trust-item"><span className="ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 12h16M14 6l6 6-6 6" stroke="#E5B48C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span>{t('home.trust3', 'Tracked start to finish')}</div>
            </div>
          </div>

          <div className="detect-card-new">
            <div className="detect-header-new">
              <div className="detect-header-left">
                <span className="ai-kicker">{t('home.aiDetectionKicker', 'AI DETECTION')}</span>
                <h3>{t('home.aiDetectionTitle', 'We found these items!')}</h3>
                <p>{t('home.aiDetectionDesc', 'Our AI identified the items in your image. Review and confirm before continuing.')}</p>
              </div>
              <div className="ai-badge-new">
                <Sparkles size={16} />
                <div className="ai-badge-text">
                  <strong>{t('home.aiPowered', 'AI Powered')}</strong>
                  <span>{t('home.detectingKinderWorld', 'Detecting a kinder world')}</span>
                </div>
              </div>
            </div>

            <div className="detect-photo-new">
              <img src="/donation_box.jpg" alt={t('home.donationBox', 'Donation box')} />

              <div className="scan-box-new" style={{ top: '32%', left: '32%', width: '21%', height: '33%', borderColor: '#2F7A4F' }}>
                <div className="box-label-new" style={{ backgroundColor: '#2F7A4F' }}><Box size={14} /> {t('home.teddyBear', 'Teddy Bear')} &nbsp;<strong>92%</strong></div>
              </div>
              <div className="scan-box-new" style={{ top: '35%', left: '12%', width: '20%', height: '30%', borderColor: '#C4622D' }}>
                <div className="box-label-new" style={{ backgroundColor: '#C4622D' }}><BookOpen size={14} /> {t('home.book', 'Book')} &nbsp;<strong>88%</strong></div>
              </div>
              <div className="scan-box-new" style={{ top: '38%', left: '54%', width: '31%', height: '16%', borderColor: '#8064D8' }}>
                <div className="box-label-new" style={{ backgroundColor: '#8064D8' }}><Shirt size={14} /> {t('home.clothes', 'Clothes')} &nbsp;<strong>95%</strong></div>
              </div>
              <div className="scan-box-new" style={{ top: '48%', left: '62%', width: '28%', height: '18%', borderColor: '#E0A030' }}>
                <div className="box-label-new" style={{ backgroundColor: '#E0A030' }}><Monitor size={14} /> {t('home.electronics', 'Electronics')} &nbsp;<strong>64%</strong></div>
              </div>
            </div>

            <div className="detect-list-new">
              <div className="detect-list-header-new">
                <h4>{t('home.detectedItems', 'Detected items')}</h4>
                <span className="status-chip-new"><Brain size={14} /> {t('home.aiDetectionLabel', 'AI detection')}</span>
              </div>

              <div className="detect-row-new">
                <div className="detect-item-info">
                  <div className="detect-icon-wrapper">
                    <img src="/donation_box.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '25% 35%' }} alt="teddy" />
                  </div>
                  <div className="detect-item-text">
                    <strong>{t('home.teddyBear', 'Teddy bear')}</strong>
                    <span>{t('home.stuffedToy', 'Stuffed toy')}</span>
                  </div>
                </div>
                <div className="detect-progress-container">
                  <div className="detect-progress-bg">
                    <div className="detect-progress-bar" style={{ backgroundColor: '#2F7A4F', width: '92%' }}></div>
                  </div>
                </div>
                <span className="detect-conf" style={{ color: '#2F7A4F' }}>92%</span>
                <span className="detect-status success"><CheckCircle size={14} /> {t('home.detected', 'Detected')}</span>
              </div>

              <div className="detect-row-new">
                <div className="detect-item-info">
                  <div className="detect-icon-wrapper">
                    <img src="/donation_box.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 25%' }} alt="book" />
                  </div>
                  <div className="detect-item-text">
                    <strong>{t('home.book', 'Book')}</strong>
                    <span>{t('home.printedBook', 'Printed book')}</span>
                  </div>
                </div>
                <div className="detect-progress-container">
                  <div className="detect-progress-bg">
                    <div className="detect-progress-bar" style={{ backgroundColor: '#C4622D', width: '88%' }}></div>
                  </div>
                </div>
                <span className="detect-conf" style={{ color: '#C4622D' }}>88%</span>
                <span className="detect-status success"><CheckCircle size={14} /> {t('home.detected', 'Detected')}</span>
              </div>

              <div className="detect-row-new">
                <div className="detect-item-info">
                  <div className="detect-icon-wrapper">
                    <img src="/donation_box.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '80% 45%' }} alt="electronics" />
                  </div>
                  <div className="detect-item-text">
                    <strong>{t('home.electronics', 'Electronics')}</strong>
                    <span>{t('home.electronicDevice', 'Electronic device')}</span>
                  </div>
                </div>
                <div className="detect-progress-container">
                  <div className="detect-progress-bg">
                    <div className="detect-progress-bar" style={{ backgroundColor: '#E0A030', width: '64%' }}></div>
                  </div>
                </div>
                <span className="detect-conf" style={{ color: '#E0A030' }}>64%</span>
                <span className="detect-status review"><AlertCircle size={14} /> {t('home.review', 'Review')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how">
        <div className="wrap">
          <div className="section-head">
            <div className="kicker">{t('home.howItWorksKicker', 'How Donation AI works')}</div>
            <h2>{t('home.howItWorksTitle', 'From your closet to someone\'s doorstep')}</h2>
            <p>{t('home.howItWorksDesc', 'Four steps connect what you no longer need with the people who need it most.')}</p>
          </div>
          <div className="steps">
            <div className="step-card">
              <div className="step-num">1</div>
              <h3>{t('home.step1Title', 'Capture or upload')}</h3>
              <p>{t('home.step1Desc', 'Take a photo of the items you want to donate, or upload one from your gallery.')}</p>
            </div>
            <div className="step-card">
              <div className="step-num">2</div>
              <h3>{t('home.step2Title', 'AI identifies items')}</h3>
              <p>{t('home.step2Desc', 'Our model detects each item and scores its confidence, so nothing gets added by mistake.')}</p>
            </div>
            <div className="step-card">
              <div className="step-num">3</div>
              <h3>{t('home.step3Title', 'We match your NGO')}</h3>
              <p>{t('home.step3Desc', 'Items are matched to nearby NGOs based on need, priority, and distance.')}</p>
            </div>
            <div className="step-card">
              <div className="step-num">4</div>
              <h3>{t('home.step4Title', 'Track the impact')}</h3>
              <p>{t('home.step4Desc', 'Follow your donation from pickup to delivery, and see who it reached.')}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="detection" className="bg-tint">
        <div className="wrap">
          <div className="section-head">
            <div className="kicker">{t('home.detectionKicker', 'Detection, made honest')}</div>
            <h2>{t('home.detectionTitle', 'When the AI isn\'t sure, you decide')}</h2>
            <p>{t('home.detectionDesc', 'Every detected item is scored, not just accepted. That score changes what happens next — so uncertainty is visible, not hidden.')}</p>
          </div>
          <div className="conf-grid">
            <div className="conf-card">
              <span className="conf-tag high">{t('home.confHigh', '92% confidence')}</span>
              <h4>{t('home.addedAuto', 'Added automatically')}</h4>
              <p>{t('home.addedAutoDesc', 'High-confidence detections go straight into your donation cart.')}</p>
              <span className="conf-action added">{t('home.inCart', 'Already in your cart')}</span>
            </div>
            <div className="conf-card amber">
              <span className="conf-tag amber">{t('home.confMed', '74% confidence')}</span>
              <h4>{t('home.flaggedCheck', 'Flagged for a quick check')}</h4>
              <p>{t('home.flaggedCheckDesc', 'Mid-confidence items are added, but we ask you to confirm before submitting.')}</p>
              <span className="conf-action confirm">{t('home.tapConfirm', 'Tap to confirm')}</span>
            </div>
            <div className="conf-card low">
              <span className="conf-tag low">{t('home.confLow', '41% confidence')}</span>
              <h4>{t('home.leftDecide', 'Left for you to decide')}</h4>
              <p>{t('home.leftDecideDesc', 'Low-confidence items aren\'t auto-added — you choose whether to include them.')}</p>
              <span className="conf-action manual">{t('home.addManual', 'Possible item — add manually')}</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap match-wrap">
          <div className="match-copy">
            <div className="kicker">{t('home.matchKicker', 'No black-box matching')}</div>
            <h2>{t('home.matchTitle', 'See exactly why an NGO was matched')}</h2>
            <p>{t('home.matchDesc', 'Instead of a single "matched" label, every match shows the factors behind it — item fit, distance, and how urgent the need is. It\'s the fastest way to earn trust from donors and NGOs alike.')}</p>
            <ul className="match-points">
              <li><span className="check"><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></span>{t('home.matchPoint1', 'Ranking factors shown in plain language, not a score alone')}</li>
              <li><span className="check"><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></span>{t('home.matchPoint2', 'Priority need and expiry dates kept visible, not buried')}</li>
              <li><span className="check"><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></span>{t('home.matchPoint3', 'Same match card on donor and NGO dashboards')}</li>
            </ul>
          </div>
          <div className="match-card">
            <div className="match-card-head">
              <h4>{t('home.matchNgoName', 'Matched with Sunrise Children\'s Home')}</h4>
              <span className="ngo-badge">{t('home.matchHighPriority', 'High priority')}</span>
            </div>
            <div className="match-factor"><span className="label">{t('home.matchItemFit', 'Item match')}</span><span className="value">95%</span></div>
            <div className="match-factor"><span className="label">{t('home.matchDistance', 'Distance')}</span><span className="value">{t('home.matchKm', '2.3 km away')}</span></div>
            <div className="match-factor"><span className="label">{t('home.matchNeedExpires', 'Need expires')}</span><span className="value" style={{ color: '#8A5D0F' }}>{t('home.matchDays', 'In 3 days')}</span></div>
            <div className="match-score">
              <span className="num">95%</span>
              <span className="lbl">{t('home.matchOverall', 'overall match')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-tint">
        <div className="wrap">
          <div className="section-head">
            <div className="kicker">{t('home.pipelineKicker', 'One pipeline, every role')}</div>
            <h2>{t('home.pipelineTitle', 'Track a donation from submission to delivery')}</h2>
            <p>{t('home.pipelineDesc', 'The same status stepper appears on both donor and NGO dashboards, so nobody is guessing where things stand.')}</p>
          </div>
          <div className="pipeline-card-wrapper" style={{ background: '#fff', border: '1px solid #EFE9DE', borderRadius: '16px', padding: '32px 28px' }}>
            <div className="pipeline">
              <div className="pipe-step done"><div className="pipe-dot done"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></div><span>{t('home.pipeMatched', 'Matched')}</span></div>
              <div className="pipe-step done"><div className="pipe-dot done"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></div><span>{t('home.pipeNotified', 'Packaging notified')}</span></div>
              <div className="pipe-step current"><div className="pipe-dot current"></div><span>{t('home.pipePickup', 'Pickup scheduled')}</span></div>
              <div className="pipe-step"><div className="pipe-dot"></div><span>{t('home.pipeCollected', 'Collected')}</span></div>
              <div className="pipe-step"><div className="pipe-dot"></div><span>{t('home.pipeDelivered', 'Delivered')}</span></div>
              <div className="pipe-step"><div className="pipe-dot"></div><span>{t('home.pipeAcknowledged', 'Acknowledged')}</span></div>
            </div>
            <div className="pipeline-caption">
              <span>{t('home.pipeSubmitted', 'Submitted Sep 6')}</span>
              <span>{t('home.pipePickupTime', 'Pickup tomorrow, 10:00 AM')}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="impact">
        <div className="wrap">
          <div className="section-head">
            <div className="kicker">{t('home.impactKicker', 'Together we create change')}</div>
            <h2>{t('home.impactTitle', 'Real people, real impact')}</h2>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-ic" style={{ background: '#F7E9DE' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 10a4 4 0 100-8 4 4 0 000 8z" stroke="#C4622D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
              <div className="stat-num">1,250+</div>
              <div className="stat-lbl">{t('home.statDonors', 'Registered donors')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-ic" style={{ background: '#E4F0E8' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" stroke="#2F7A4F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
              <div className="stat-num">180+</div>
              <div className="stat-lbl">{t('home.statNgos', 'Partner NGOs')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-ic" style={{ background: '#EEEBFA' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8" stroke="#8064D8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
              <div className="stat-num">12,500+</div>
              <div className="stat-lbl">{t('home.statItems', 'Items donated')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-ic" style={{ background: '#FAF0DD' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.35-9.5-8.8C.7 8.6 2.5 5 6 5c1.9 0 3.5 1.1 6 3.4C14.5 6.1 16.1 5 18 5c3.5 0 5.3 3.6 3.5 7.2C19 16.65 12 21 12 21z" stroke="#E0A030" strokeWidth="1.8" strokeLinejoin="round" /></svg></div>
              <div className="stat-num">8,900+</div>
              <div className="stat-lbl">{t('home.statLives', 'Lives impacted')}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-tint" id="ngos">
        <div className="wrap">
          <div className="split">
            <div className="split-card donor">
              <h3>{t('home.forDonors', 'For donors')}</h3>
              <p>{t('home.forDonorsDesc', 'Turn a five-minute photo into a donation you can track from pickup to delivery.')}</p>
              <Link to="/register" className="action-btn action-btn-white">{t('home.startDonating', 'Start donating')}</Link>
            </div>
            <div className="split-card ngo">
              <h3>{t('home.forNgos', 'For NGOs')}</h3>
              <p>{t('home.forNgosDesc', 'List what you need, set priority, and receive matches without chasing donors.')}</p>
              <Link to="/register?role=ngo" className="action-btn action-btn-white" style={{ color: 'var(--secondary-700)' }}>{t('home.registerYourNgo', 'Register your NGO')}</Link>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <div className="logo" style={{ marginBottom: '14px' }}>
                <div className="logo-mark">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.1 2.3 4 6.3 4c2.2 0 3.9 1.2 5.7 3.3C13.8 5.2 15.5 4 17.7 4c4 0 5.9 4.1 4.3 7.7C19.5 16.4 12 21 12 21z" fill="white" /></svg>
                </div>
                <div className="logo-text">
                  <strong style={{ color: '#fff' }}>Donation AI</strong>
                  <span style={{ color: '#C9AF97' }}>{t('home.footerTagline', 'Give smarter, create bigger impact')}</span>
                </div>
              </div>
            </div>
            <div>
              <h5>{t('home.footerProduct', 'Product')}</h5>
              <ul>
                <li><a href="#how">{t('home.footerHowItWorks', 'How it works')}</a></li>
                <li><a href="#detection">{t('home.footerAiDetection', 'AI detection')}</a></li>
                <li><a href="#ngos">{t('home.footerNgos', 'NGOs')}</a></li>
                <li><a href="#impact">{t('home.footerImpact', 'Impact')}</a></li>
              </ul>
            </div>
            <div>
              <h5>{t('home.footerCompany', 'Company')}</h5>
              <ul>
                <li><a href="#">{t('home.footerAbout', 'About')}</a></li>
                <li><a href="#">{t('home.footerContact', 'Contact')}</a></li>
                <li><a href="#">{t('home.footerPrivacy', 'Privacy policy')}</a></li>
                <li><a href="#">{t('home.footerTerms', 'Terms of service')}</a></li>
              </ul>
            </div>
            <div>
              <h5>{t('home.footerStayUpdated', 'Stay updated')}</h5>
              <p style={{ fontSize: '14px', color: '#C9AF97', margin: 0 }}>{t('home.footerNewsletter', 'Get news on new NGO partners and product updates.')}</p>
              <div className="subscribe">
                <input type="email" id="subscribe-email" name="subscribe-email" placeholder={t('home.footerEmailPlaceholder', 'Enter your email')} aria-label={t('home.footerEmailPlaceholder', 'Email address')} />
                <button className="action-btn action-btn-primary" style={{ padding: '10px 16px' }}>{t('home.footerSubscribe', 'Subscribe')}</button>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>{t('home.footerCopyright', '© 2026 Donation AI. All rights reserved.')}</span>
            <span>{t('home.footerTech', 'Technology that turns giving into impact.')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}