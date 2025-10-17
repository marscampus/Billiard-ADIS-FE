import React, { forwardRef } from 'react';

const PrintReceipt = forwardRef((props, ref) => {
    const { dataStruk } = props;

    // Style untuk nilai yang right-aligned
    const rightAlign = {
        textAlign: 'right',
        paddingLeft: '10px'
    };

    // Komponen helper untuk membuat baris grid dengan 3 kolom: label, titik dua, dan value
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
                padding: '5px 15px',
                fontFamily: "'Courier New', monospace",
                fontSize: '12px',
                lineHeight: '1.4',
                maxWidth: '250px',
                margin: '0 auto'
            }}
        >
            {/* HEADER */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <img src={dataStruk?.LOGOPERUSAHAAN} alt="Logo" style={{ width: '50px', margin: '5px auto' }} />
                <h3 style={{ margin: '4px 0', fontSize: '14px' }}>{dataStruk?.NAMAPERUSAHAAN}</h3>
                <p style={{ margin: '2px 0' }}>
                    {dataStruk?.ALAMATPERUSAHAAN}
                    <br />
                    Antrian: {dataStruk?.ANTRIAN}
                </p>
            </div>
            <hr style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

            {/* INFO TRANSAKSI */}
            <div>
                <GridRow label="Faktur" value={dataStruk?.FAKTUR} />
                <GridRow label="Kasir" value={dataStruk?.KASIR} />
                <GridRow label="Tanggal" value={dataStruk?.TANGGAL} />
                {dataStruk?.MEMBER ? <GridRow label="Member" value={dataStruk.MEMBER} /> : <GridRow label="Pelanggan" value={dataStruk?.PELANGGAN} />}
                {dataStruk?.MEJA && <GridRow label="Meja" value={dataStruk.MEJA} />}
            </div>
            <hr style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

            {/* DETAIL ITEM */}
            <div style={{ margin: '6px 0' }}>
                {dataStruk?.items.map((item, i) => (
                    <div key={i} style={{ margin: '4px 0' }}>
                        <div style={{ fontWeight: 'bold' }}>{item.NAMA}</div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr',
                                gap: '2px',
                                alignItems: 'center'
                            }}
                        >
                            <span>
                                {item.QTY} x {parseInt(item.HJ).toLocaleString()}
                            </span>
                            <span style={rightAlign}>{parseInt(item.SUBTOTAL).toLocaleString()}</span>
                        </div>
                    </div>
                ))}
            </div>
            <hr style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

            {/* TOTAL */}
            <div>
                <GridRow label="Pemesanan" value={dataStruk?.PEMESANAN} />
                <GridRow label="Total Items" value={dataStruk?.items.length} />
                <GridRow label="Total Qty" value={dataStruk?.items.reduce((a, b) => a + parseInt(b.QTY), 0)} />
                <GridRow label="Total" value={parseInt(dataStruk?.TOTAL).toLocaleString()} bold />
            </div>

            {/* PEMBAYARAN */}
            <div style={{ marginTop: '8px' }}>
                {dataStruk?.CARABAYAR === 'Tunai' && <GridRow label="Tunai" value={parseInt(dataStruk?.TUNAI).toLocaleString()} />}
                {dataStruk?.CARABAYAR === 'Debet' && <GridRow label="Debet" value={parseInt(dataStruk?.BAYARKARTU).toLocaleString()} />}
                {dataStruk?.CARABAYAR === 'QRIS' && <GridRow label="QRIS" value={parseInt(dataStruk?.EPAYMENT).toLocaleString()} />}
                {dataStruk?.DISCOUNT > 0 && <GridRow label="Diskon" value={`-${parseInt(dataStruk.DISCOUNT).toLocaleString()}`} />}
                {dataStruk?.DONASI > 0 && <GridRow label="Donasi" value={parseInt(dataStruk.DONASI).toLocaleString()} />}
                <GridRow label="Kembali" value={parseInt(dataStruk?.KEMBALIAN).toLocaleString()} bold />
            </div>

            {/* INFO PEMBAYARAN DETAIL */}
            {(dataStruk?.CARABAYAR === 'Debet' || dataStruk?.CARABAYAR === 'QRIS') && (
                <div style={{ marginTop: '8px' }}>
                    {dataStruk?.CARABAYAR === 'Debet' && (
                        <>
                            <GridRow label="Kartu" value={dataStruk.NAMAKARTU} />
                            <GridRow label="No. Kartu" value={`•••• ${dataStruk.NOMORKARTU.slice(-4)}`} />
                        </>
                    )}
                    {dataStruk?.CARABAYAR === 'QRIS' && (
                        <>
                            <GridRow label="Jenis" value={dataStruk.TIPEEPAYMENT} />
                            <GridRow label="ID Transaksi" value={`•••• ${dataStruk.NOMORKARTU.slice(-4)}`} />
                        </>
                    )}
                </div>
            )}

            {/* FOOTER */}
            <div
                style={{
                    marginTop: '12px',
                    textAlign: 'center',
                    fontSize: '11px',
                    borderTop: '1px dashed #000',
                    paddingTop: '6px'
                }}
            >
                Terima Kasih Atas Kunjungan Anda
            </div>
        </div>
    );
});

export default PrintReceipt;
