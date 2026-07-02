import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function HowToUsePage() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>
        <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '16px' }}>How to Use YTAutomate</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '1.1rem' }}>
          Follow this step-by-step video guide and instructions to easily automate your YouTube Shorts publishing.
        </p>
        
        {/* Responsive Video Embed */}
        <div style={{ 
          position: 'relative', 
          paddingBottom: '56.25%', 
          height: 0, 
          overflow: 'hidden', 
          borderRadius: '16px', 
          border: '1px solid #27272a', 
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          marginBottom: '48px',
          background: '#000'
        }}>
          <iframe
            src="https://www.youtube.com/embed/pvnyl69xl80"
            title="How to Schedule & Auto-Upload YouTube Shorts - YTAutomate Guide"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="glass" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: '1.8' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', borderBottom: '1px solid #27272a', paddingBottom: '12px' }}>
            Step-by-Step Instructions
          </h2>

          <section style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ 
              background: 'var(--primary)', 
              color: '#000', 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 'bold',
              flexShrink: 0,
              fontSize: '1.1rem'
            }}>1</div>
            <div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', color: '#fff' }}>Sign in to YTAutomate</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Click the **Login** button on the home page and sign in securely using your Google Account. There is no password required.
              </p>
            </div>
          </section>

          <section style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ 
              background: 'var(--primary)', 
              color: '#000', 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 'bold',
              flexShrink: 0,
              fontSize: '1.1rem'
            }}>2</div>
            <div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', color: '#fff' }}>Connect Your YouTube Channel</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Once you land on the dashboard, you will be prompted to link your YouTube channel. Click **Connect Channel**, select your Google account, and ensure you check the permission box to **"Manage your YouTube videos"** so the system can upload Shorts on your behalf.
              </p>
            </div>
          </section>

          <section style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ 
              background: 'var(--primary)', 
              color: '#000', 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 'bold',
              flexShrink: 0,
              fontSize: '1.1rem'
            }}>3</div>
            <div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', color: '#fff' }}>Upload and Schedule Videos</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Go to the **Upload** page, drop your video files, and set your desired Title, Description, and scheduling time. The scheduler runs automatically to post your videos exactly at the chosen time.
              </p>
            </div>
          </section>

          <section style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ 
              background: 'var(--primary)', 
              color: '#000', 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 'bold',
              flexShrink: 0,
              fontSize: '1.1rem'
            }}>4</div>
            <div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', color: '#fff' }}>Monitor Publishing Status</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Track the status of your uploads right from the main **Dashboard**. Once a video is successfully published, its status will update to "Completed", and a direct link to the live video on YouTube will be provided.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
