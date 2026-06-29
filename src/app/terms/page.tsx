import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>
        <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '24px' }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Last updated: June 2026</p>
        
        <div className="glass" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.8' }}>
          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--primary)' }}>1. Acceptance of Terms</h2>
            <p>By accessing and using YT Automate, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--primary)' }}>2. Description of Service</h2>
            <p>YT Automate provides tools to help YouTube creators upload and manage their Shorts content efficiently. We are an independent service provider and are not officially affiliated with Google or YouTube.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--primary)' }}>3. User Responsibilities</h2>
            <p>You are solely responsible for the content you upload through our service. You must ensure that you have all necessary rights and permissions for the content you process, and that it complies with YouTube's Community Guidelines.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--primary)' }}>4. Termination</h2>
            <p>We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--primary)' }}>5. Limitation of Liability</h2>
            <p>In no event shall YT Automate, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
