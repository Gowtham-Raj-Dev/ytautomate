import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>
        <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '24px' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Last updated: June 2026</p>
        
        <div className="glass" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.8' }}>
          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--primary)' }}>1. Introduction</h2>
            <p>Welcome to YT Automate. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--primary)' }}>2. Data We Collect</h2>
            <p>When you use YT Automate, we may collect the following data:</p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '8px' }}>
              <li><strong>Account Information:</strong> Your Google account email, name, and profile picture when you sign in via Google OAuth.</li>
              <li><strong>YouTube Data:</strong> Information about your YouTube channel and videos to facilitate the uploading process on your behalf.</li>
              <li><strong>Usage Data:</strong> Information about how you use our application.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--primary)' }}>3. How We Use Your Data</h2>
            <p>We use your data exclusively to provide our services. Specifically, your YouTube authorization is used solely to upload videos to your channel according to your explicit instructions. We do not sell or share your personal data with third parties.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--primary)' }}>4. YouTube API Services</h2>
            <p>YT Automate uses YouTube API Services. By using our application, you are agreeing to be bound by the YouTube Terms of Service. You can revoke our application's access to your data via the Google security settings page.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--primary)' }}>5. Contact Us</h2>
            <p>If you have any questions about this privacy policy, please contact us at support@codelove.in.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
