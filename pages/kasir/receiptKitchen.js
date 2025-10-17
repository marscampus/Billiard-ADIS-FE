import React, { forwardRef } from 'react';

const ReceiptKitchen = forwardRef((props, ref) => {
    const { dataStrukDapur } = props;
    console.log('masuk receipt');
    const rightAlign = {
        textAlign: 'right',
        paddingLeft: '10px'
    };
    const GridRow = ({ label, value, bold = false }) => (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'auto auto 1fr',
                gap: '2px',
                alignItems: 'center',
                marginBottom: '2px'
            }}
        >
            <span>{label}</span>
            <span></span>
            <span style={{ ...rightAlign, ...(bold ? { fontWeight: 'bold' } : {}) }}>{value}</span>
        </div>
    );

    return (
        <div
            ref={ref}
            style={{
                padding: '5px 20px', // Menambahkan padding lebih banyak pada kiri dan kanan
                fontFamily: 'Helvetica, monospace',
                fontSize: '10px',
                lineHeight: '1.3',
                margin: '0 auto', // Agar kontainer terpusat di tengah
                maxWidth: '250px' // Batas lebar agar tidak terlalu lebar
            }}
        >
            {/* HEADER */}
            <div style={{ textAlign: 'center', margin: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={dataStrukDapur?.LOGOPERUSAHAAN} alt="Logo Perusahaan" style={{ width: '50px', height: '50px', marginRight: '10px' }} />
            </div>
            <h3 style={{ textAlign: 'center', margin: '5px' }}>{dataStrukDapur?.NAMAPERUSAHAAN}</h3>
            <p style={{ textAlign: 'center', margin: '2px ' }}>
                {dataStrukDapur?.ALAMATPERUSAHAAN}, {dataStrukDapur?.TELP}
            </p>
            <p style={{ textAlign: 'center', margin: '2px ' }}>Antrian : {dataStrukDapur?.ANTRIAN}</p>
            <p style={{ textAlign: 'center', margin: '2px ' }}>Cetak Untuk Dapur</p>

            <hr style={{ margin: '5px 0' }} />
            {/* INFORMASI TRANSAKSI */}
            
            <GridRow label="Kasir" value={dataStrukDapur?.KASIR} />
            <GridRow label="Tanggal" value={dataStrukDapur?.TANGGAL} />
            <GridRow label="Pelanggan" value={dataStrukDapur?.PELANGGAN} />
            <GridRow label="Meja" value={dataStrukDapur?.MEJA} />

            <hr style={{ margin: '5px' }} />

            {/* DETAIL BARANG */}
            {dataStrukDapur?.items.map((item, index) => (
                <div
                    key={index}
                    style={{
                        marginBottom: '5px',
                        borderBottom: '1px dotted #ddd',
                        paddingBottom: '3px'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '2px'
                        }}
                    >
                        <div style={{ flex: 1, textAlign: 'left', marginLeft: '5px' }}>
                            {item.QTY} x {item.NAMA}
                        </div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                            {item.NOTES.split(';').map(
                                (note, index) =>
                                    note.trim() && ( // Pastikan item tidak kosong setelah di-trim
                                        <li key={index}>{note.trim()}</li>
                                    )
                            )}
                        </ul>
                    </div>
                </div>
            ))}
            <hr style={{ margin: '5px 0' }} />

            {/* FOOTER PESAN */}
            <p style={{ textAlign: 'center', marginTop: '10px' }}>Mohon untuk dicek kembali sebelum disajikan kepada customer!^^</p>
        </div>
    );
});

export default ReceiptKitchen;
