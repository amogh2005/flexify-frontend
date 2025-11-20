import './Support.css';

export default function Support() {
  return (
    <div className="support-container">
      <div className="support-header">
        <h1>Help & Support</h1>
        <p>We’re here to help you with bookings, payments, and any issues.</p>
      </div>

      <div className="support-grid">

        {/* Phone Support */}
        <div className="support-card clickable">
          <div className="icon-box">📞</div>
          <h3>Phone Support</h3>
          <p className="info-text">Click to call</p>
          <a href="tel:+**********" className="highlight link">
            +91 ***** *****
          </a>
        </div>

        {/* Email Support #1 */}
        <div className="support-card clickable">
          <div className="icon-box">📧</div>
          <h3>Email Support</h3>
          <p className="info-text">We reply within 24 hours</p>
          <a 
            // href="mailto:nithinnmallikarjuna@gmail.com" 
            href="mailto:comparisonworld748@gmail.com" 
            className="highlight link"
          >
            comparisonworld748@gmail.com
          </a>
        </div>

        {/* Email Support #2
        <div className="support-card clickable">
          <div className="icon-box">📨</div>
          <h3>Alternative Email</h3>
          <p className="info-text">Backup support email</p>
          <a 
            href="mailto:comparisonworld748@gmail.com" 
            className="highlight link"
          >
            comparisonworld748@gmail.com
          </a>
        </div> */}

        {/* Issue Reporting */}
        {/* <div className="support-card">
          <div className="icon-box">🐞</div>
          <h3>Report an Issue</h3>
          <p className="info-text">Found a bug or facing a problem?</p>
          <button className="btn-primary">Raise Ticket</button>
        </div> */}

      </div>
    </div>
  );
}
