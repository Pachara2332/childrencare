'use client'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="th">
            <body>
                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#FAF8F5',
                        fontFamily: 'system-ui, sans-serif',
                        padding: '24px',
                    }}
                >
                    <div style={{ textAlign: 'center', maxWidth: '360px' }}>
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '16px',
                                background: '#FFF0ED',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                fontSize: '28px',
                            }}
                        >
                            ⚠️
                        </div>
                        <h2
                            style={{
                                fontSize: '18px',
                                fontWeight: 700,
                                color: '#1C3D2E',
                                marginBottom: '8px',
                            }}
                        >
                            เกิดข้อผิดพลาด
                        </h2>
                        <p
                            style={{
                                fontSize: '14px',
                                color: '#8B8478',
                                marginBottom: '24px',
                                lineHeight: '1.6',
                            }}
                        >
                            ระบบไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง
                        </p>
                        <button
                            onClick={() => reset()}
                            style={{
                                padding: '10px 28px',
                                borderRadius: '12px',
                                background: '#1C3D2E',
                                color: 'white',
                                border: 'none',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            ลองอีกครั้ง
                        </button>
                    </div>
                </div>
            </body>
        </html>
    )
}
