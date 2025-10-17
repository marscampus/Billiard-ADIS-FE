import React, { forwardRef } from 'react';

const PrintReceipt = forwardRef((props, ref) => {
    const { dataStruk } = props;
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
                <img src={dataStruk?.LOGOPERUSAHAAN} alt="Logo Perusahaan" style={{ width: '50px', height: '50px', marginRight: '10px' }} />
            </div>
            <h3 style={{ textAlign: 'center', margin: '5px' }}>{dataStruk?.NAMAPERUSAHAAN}</h3>
            <p style={{ textAlign: 'center', margin: '2px ' }}>
                {dataStruk?.ALAMATPERUSAHAAN}, {dataStruk?.TELP}
            </p>
            <hr style={{ margin: '5px 0' }} />

            {/* INFORMASI TRANSAKSI */}
            <div style={{ display: 'flex' }}>
                <span style={{ minWidth: '60px', textAlign: 'left' }}>Faktur</span>
                <span style={{ margin: '2px' }}>:</span>
                <span style={{ flex: 1 }}>{dataStruk?.FAKTUR}</span>
            </div>
            <div style={{ display: 'flex' }}>
                <span style={{ minWidth: '60px', textAlign: 'left' }}>Kasir</span>
                <span style={{ margin: '2px' }}>:</span>
                <span style={{ flex: 1 }}>{dataStruk?.KASIR}</span>
            </div>
            <div style={{ display: 'flex' }}>
                <span style={{ minWidth: '60px', textAlign: 'left' }}>Tanggal</span>
                <span style={{ margin: '2px' }}>:</span>
                <span style={{ flex: 1 }}>{dataStruk?.TANGGAL}</span>
            </div>
            {dataStruk?.MEMBER ? (
                <div style={{ display: 'flex' }}>
                    <span style={{ minWidth: '60px', textAlign: 'left' }}>Member</span>
                    <span style={{ margin: '2px' }}>:</span>
                    <span style={{ flex: 1 }}>{dataStruk?.MEMBER}</span>
                </div>
            ) : (
                <div style={{ display: 'flex' }}>
                    <span style={{ minWidth: '60px', textAlign: 'left' }}>Pelanggan</span>
                    <span style={{ margin: '2px' }}>:</span>
                    <span style={{ flex: 1 }}>{dataStruk?.PELANGGAN}</span>
                </div>
            )}
            {dataStruk?.MEJA && (
                <div style={{ display: 'flex' }}>
                    <span style={{ minWidth: '60px', textAlign: 'left' }}>Meja</span>
                    <span style={{ margin: '2px' }}>:</span>
                    <span style={{ flex: 1 }}>{dataStruk?.MEJA}</span>
                </div>
            )}
            {/* <div style={{ display: "flex" }}>
                <span style={{ minWidth: "60px", textAlign: "left" }}>Antrian</span>
                <span style={{ margin: "2px" }}>:</span>
                <span style={{ flex: 1 }}>{dataStruk?.ANTRIAN}</span>
            </div> */}
            <hr style={{ margin: '5px' }} />

            {/* DETAIL BARANG */}
            {dataStruk?.items.map((item, index) => (
                <div
                    key={index}
                    style={{
                        marginBottom: '5px',
                        borderBottom: '1px dotted #ddd',
                        paddingBottom: '3px'
                    }}
                >
                    <div style={{ textAlign: 'left' }}>{item?.NAMA}</div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '2px'
                        }}
                    >
                        <div style={{ flex: 1, textAlign: 'left', marginLeft: '5px' }}>
                            {item.QTY} x {parseInt(item?.HJ).toLocaleString()}
                        </div>
                        <div style={{ flex: 1, textAlign: 'right' }}>{parseInt(item?.SUBTOTAL).toLocaleString()}</div>
                    </div>
                </div>
            ))}
            <hr style={{ margin: '5px 0' }} />

            {/* FOOTER TOTAL */}
            <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}>
                    <span style={{ width: '100px', textAlign: 'right' }}>Total Items</span>
                    <span>:</span>
                    <span style={{ width: '50px', textAlign: 'right' }}>{dataStruk?.items.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}>
                    <span style={{ width: '100px', textAlign: 'right' }}>Total Qty</span>
                    <span>:</span>
                    <span style={{ width: '50px', textAlign: 'right' }}>{dataStruk?.items.reduce((acc, item) => acc + parseInt(item.QTY), 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}>
                    <span style={{ width: '100px', textAlign: 'right' }}>Total</span>
                    <span>:</span>
                    <span style={{ width: '50px', textAlign: 'right' }}>{parseInt(dataStruk?.TOTAL).toLocaleString()}</span>
                </div>

                {/* Cara Bayar */}
                {dataStruk?.CARABAYAR === 'Tunai' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}>
                        <span style={{ width: '100px', textAlign: 'right' }}>Tunai</span>
                        <span>:</span>
                        <span style={{ width: '50px', textAlign: 'right' }}>{parseInt(dataStruk?.TUNAI).toLocaleString()}</span>
                    </div>
                )}
                {dataStruk?.CARABAYAR === 'Debet' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}>
                        <span style={{ width: '100px', textAlign: 'right' }}>Debet</span>
                        <span>:</span>
                        <span style={{ width: '50px', textAlign: 'right' }}>{parseInt(dataStruk?.BAYARKARTU).toLocaleString()}</span>
                    </div>
                )}
                {dataStruk?.CARABAYAR === 'QRIS' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}>
                        <span style={{ width: '100px', textAlign: 'right' }}>QRIS</span>
                        <span>:</span>
                        <span style={{ width: '50px', textAlign: 'right' }}>{parseInt(dataStruk?.EPAYMENT).toLocaleString()}</span>
                    </div>
                )}

                {dataStruk?.DISCOUNT > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}>
                        <span style={{ width: '100px', textAlign: 'right' }}>Diskon</span>
                        <span>:</span>
                        <span style={{ width: '50px', textAlign: 'right' }}>{parseInt(dataStruk?.DISCOUNT).toLocaleString()}</span>
                    </div>
                )}

                {dataStruk?.DONASI > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}>
                        <span style={{ width: '100px', textAlign: 'right' }}>Donasi</span>
                        <span>:</span>
                        <span style={{ width: '50px', textAlign: 'right' }}>{parseInt(dataStruk?.DONASI).toLocaleString()}</span>
                    </div>
                )}

                {/* Kembali */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}>
                    <span style={{ width: '100px', textAlign: 'right' }}>Kembali</span>
                    <span>:</span>
                    <span style={{ width: '50px', textAlign: 'right' }}>{parseInt(dataStruk?.KEMBALIAN).toLocaleString()}</span>
                </div>
            </div>

            {/* Debet dan Epayment */}
            <div style={{ fontSize: '10px', marginBottom: '10px' }}>
                {dataStruk?.CARABAYAR === 'Debet' && (
                    <div style={{ fontSize: '10px', lineHeight: '1.5', margin: '0 auto', width: '250px' }}>
                        <div style={{ display: 'flex' }}>
                            <span style={{ minWidth: '60px', textAlign: 'left' }}>Nama Kartu</span>
                            <span style={{ margin: '0 5px' }}>:</span>
                            <span style={{ textAlign: 'left', flex: 1 }}>{dataStruk?.NAMAKARTU}</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <span style={{ minWidth: '60px', textAlign: 'left' }}>Nomor Kartu</span>
                            <span style={{ margin: '0 5px' }}>:</span>
                            <span style={{ textAlign: 'left', flex: 1 }}>**** **** **** {dataStruk?.NOMORKARTU.slice(-3)}</span>
                        </div>
                    </div>
                )}

                {dataStruk?.CARABAYAR === 'QRIS' && (
                    <div style={{ fontSize: '10px', lineHeight: '1.5', margin: '0 auto', width: '250px' }}>
                        <div style={{ display: 'flex' }}>
                            <span style={{ minWidth: '60px', textAlign: 'left' }}>Jenis Bayar</span>
                            <span style={{ margin: '0 5px' }}>:</span>
                            <span style={{ textAlign: 'left', flex: 1 }}>{dataStruk?.TIPEEPAYMENT}</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <span style={{ minWidth: '60px', textAlign: 'left' }}>ID</span>
                            <span style={{ margin: '0 5px' }}>:</span>
                            <span style={{ textAlign: 'left', flex: 1 }}>**** **** **** {dataStruk?.NOMORKARTU.slice(-3)}</span>
                        </div>
                    </div>
                )}
            </div>
            <hr style={{ margin: '5px 0' }} />

            {/* FOOTER PESAN */}
            <p style={{ textAlign: 'center', marginTop: '10px' }}>Terima Kasih Atas Kunjungan Anda</p>
        </div>
    );
});

export default PrintReceipt;
