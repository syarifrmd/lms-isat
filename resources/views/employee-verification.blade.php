<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verifikasi Registrasi - LMS Indosat</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7; color: #333333; margin: 0; padding: 40px 20px; line-height: 1.6;">
    
    <!-- Main Container -->
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <div style="text-align: center; padding: 30px 20px; border-bottom: 2px solid #f0f0f5; background-color: #ffffff;">
            <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Indosat_Ooredoo_Hutchison.png/1280px-Indosat_Ooredoo_Hutchison.png" 
                alt="Indosat Logo" 
                style="height: 50px; width: auto; object-fit: contain;"
            />
        </div>

        <!-- Body Content -->
        <div style="padding: 40px 30px;">
            <h2 style="margin-top: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Halo!</h2>
            
            <p style="font-size: 16px; color: #555555; margin-bottom: 20px;">
                Terima kasih telah login menggunakan akun Google Anda.
            </p>
            
            <p style="font-size: 16px; color: #555555; margin-bottom: 30px;">
                Untuk alasan keamanan dan memverifikasi identitas Anda sebagai anggota tim kami, silakan konfirmasi <strong>Employee ID</strong> Anda dengan menekan tombol verifikasi di bawah ini:
            </p>

            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="{{ $url }}" style="display: inline-block; background-color: #ffc908; color: #111111; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(255, 201, 8, 0.3);">
                    Verifikasi Employee ID
                </a>
            </div>

            <p style="font-size: 14px; color: #777777; margin-bottom: 5px;">Atau salin tautan berikut ke browser Anda:</p>
            <div style="background-color: #f8f9fa; padding: 12px 16px; border-radius: 6px; border: 1px solid #eeeeee; word-break: break-all;">
                <a href="{{ $url }}" style="color: #0056b3; text-decoration: none; font-size: 14px;">{{ $url }}</a>
            </div>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                <p style="font-size: 14px; color: #999999; margin-bottom: 0;"><em>Tautan verifikasi ini bersifat rahasia dan hanya berlaku sementara.</em></p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #fcfcfc; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="margin: 0; font-size: 13px; color: #888888;">&copy; {{ date('Y') }} LMS Indosat Ooredoo Hutchison. All rights reserved.</p>
        </div>
        
    </div>

</body>
</html>