<!DOCTYPE html>
<html>
<head>
    <title>Verifikasi Registrasi</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>Halo!</h2>
    <p>Terima kasih telah mencoba login menggunakan Google.</p>
    <p>Untuk alasan keamanan dan memverifikasi bahwa Anda adalah karyawan, silakan klik tombol di bawah ini untuk menginputkan <strong>Employee ID</strong> Anda:</p>
    
    <p style="text-align: center; margin: 30px 0;">
        <a href="{{ $url }}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Lanjutkan Registrasi
        </a>
    </p>

    <p>Atau salin link ini ke browser Anda:</p>
    <p>{{ $url }}</p>

    <p>Tautan ini hanya berlaku sementara.</p>
    <p>Terima kasih,<br>Tim LMS Indosat</p>
</body>
</html>