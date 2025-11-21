// // Invoice.js
// import React from 'react';

// // Pastikan fungsi rupiahConverter sudah terdefinisi
// const rupiahConverter = (number) => {
//     return new Intl.NumberFormat('id-ID', {
//         style: 'currency',
//         currency: 'IDR',
//         minimumFractionDigits: 0
//     }).format(number);
// };

// const PrintInvoice = React.forwardRef(({ data, sidebar }, ref) => {
//     // Render baris kamar dari data
//     const kamarRows = data?.kamar?.map((item, index) => (
//         <tr key={index} style={{ border: '1px solid #000' }}>
//             <td style={{ textAlign: 'left', padding: '4px' }}>{item.no_kamar}</td>
//             <td style={{ textAlign: 'right', padding: '4px' }}>{rupiahConverter(item.harga_kamar)}</td>
//             <td style={{ textAlign: 'center', padding: '4px' }}>{item.cek_in}</td>
//             <td style={{ textAlign: 'center', padding: '4px' }}>{item.cek_out}</td>
//         </tr>
//     ));

//     // Perhitungan harga
//     const hargaKamar = Number(data?.total_kamar) || 0;
//     const dp = Number(data?.dp) || 0;
//     const diskonPersen = Number(data?.disc) || 0;
//     const ppnPersen = Number(data?.ppn) || 0;

//     const hargaSetelahDP = hargaKamar - dp;
//     const jumlahDiskon = (hargaSetelahDP * diskonPersen) / 100;
//     const hargaSetelahDiskon = hargaSetelahDP - jumlahDiskon;
//     const jumlahPPN = (hargaSetelahDiskon * ppnPersen) / 100;
//     const hargaTotal = hargaSetelahDiskon + jumlahPPN;

//     const statusBayar = data?.status_bayar === '1' ? 'Lunas' : 'Belum Lunas';

//     return (
//         <div ref={ref} style={{ padding: '5px', fontFamily: 'Helvetica', fontSize: '10px', lineHeight: 1.2 }}>
//             {/* Header Invoice */}
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
//                 <div>{data?.logo_hotel && <img src={data?.logo_hotel} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />}</div>
//                 <div style={{ textAlign: 'right', fontSize: '10px' }}>
//                     <h4 style={{ margin: 0, fontSize: '14px' }}>{data?.nama_hotel}</h4>
//                     <p style={{ margin: '1px 0', fontSize: '9px' }}>{data?.alamat_hotel}</p>
//                     <p style={{ margin: 0, fontSize: '9px' }}>{data?.no_telp_hotel}</p>
//                 </div>
//             </div>
//             <hr style={{ margin: '3px 0', border: '0.5px solid #000' }} />

//             {/* Informasi Invoice/Reservasi */}
//             <div style={{ marginBottom: '3px' }}>
//                 {data?.kode_reservasi ? (
//                     <>
//                         <p style={{ margin: '2px 0', fontWeight: 'bold', fontSize: '12px' }}>Reservation: {data?.kode_reservasi}</p>
//                         <p style={{ margin: '1px 0' }}>Date: {data?.tgl_reservasi}</p>
//                         <p style={{ margin: '2px 0', fontWeight: 'bold' }}>To:</p>
//                     </>
//                 ) : (
//                     <>
//                         <p style={{ margin: '2px 0', fontWeight: 'bold', fontSize: '12px' }}>Invoice: {data?.kode_invoice}</p>
//                         <p style={{ margin: '1px 0' }}>Date: {data?.tgl_invoice}</p>
//                         <p style={{ margin: '2px 0', fontWeight: 'bold' }}>Invoice To:</p>
//                     </>
//                 )}
//             </div>

//             {/* Informasi Tamu */}
//             <div style={{ marginBottom: '5px' }}>
//                 <p style={{ margin: '1px 0' }}>{data?.nama_tamu}</p>
//                 <p style={{ margin: '1px 0' }}>{data?.nik}</p>
//                 <p style={{ margin: '1px 0' }}>{data?.no_telepon}</p>
//             </div>

//             {/* Tabel Kamar */}
//             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
//                 <thead>
//                     <tr style={{ backgroundColor: '#CCC', border: '1px solid #000' }}>
//                         <th style={{ textAlign: 'left', padding: '2px' }}>Meja</th>
//                         <th style={{ textAlign: 'right', padding: '2px' }}>Harga</th>
//                         <th style={{ textAlign: 'center', padding: '2px' }}>Mulai</th>
//                         <th style={{ textAlign: 'center', padding: '2px' }}>Selesai</th>
//                     </tr>
//                 </thead>
//                 <tbody>{kamarRows}</tbody>
//             </table>

//             {/* Perhitungan */}
//             <div style={{ marginTop: '5px' }}>
//                 <div style={{ borderTop: '1px dashed rgb(56, 56, 56)' }}>
//                     <p style={{ margin: '2px 0', fontWeight: 'bold' }}>Perhitungan:</p>
//                     <div
//                         style={{
//                             display: 'flex',
//                             justifyContent: 'space-between'
//                         }}
//                     >
//                         <div>
//                             <p style={{ margin: '3px 0' }}>Subtotal: </p>
//                             <p style={{ margin: '3px 0' }}>DP: </p>
//                             <p style={{ margin: '3px 0' }}>Diskon ({diskonPersen}%):</p>
//                             <p style={{ margin: '3px 0' }}>PPN ({ppnPersen}%):</p>
//                         </div>
//                         <div style={{ textAlign: 'right' }}>
//                             <p style={{ margin: '3px 0' }}>{rupiahConverter(hargaKamar)}</p>
//                             <p style={{ margin: '3px 0' }}>- {rupiahConverter(dp)}</p>
//                             <p style={{ margin: '3px 0' }}>- {rupiahConverter(jumlahDiskon)}</p>
//                             <p style={{ margin: '3px 0' }}>+ {rupiahConverter(jumlahPPN)}</p>
//                         </div>
//                     </div>

//                     <div
//                         style={{
//                             borderTop: '1px solid #000',
//                             paddingBottom: '8px',
//                             fontWeight: 'bold',
//                             fontSize: '12px'
//                         }}
//                     >
//                         <div
//                             style={{
//                                 display: 'flex',
//                                 justifyContent: 'space-between'
//                             }}
//                         >
//                             <div>
//                                 <p style={{ margin: '3px 0' }}>Total: </p>
//                             </div>
//                             <div style={{ textAlign: 'right' }}>
//                                 <p style={{ margin: '3px 0' }}>{rupiahConverter(hargaTotal)}</p>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Pembayaran */}
//             <div style={{ marginTop: '5px' }}>
//                 <div style={{ borderTop: '1px dashed rgb(56, 56, 56)' }}>
//                     <p style={{ margin: '2px 0', fontWeight: 'bold' }}>Pembayaran:</p>
//                     <div
//                         style={{
//                             display: 'flex',
//                             justifyContent: 'space-between'
//                         }}
//                     >
//                         <div>
//                             <p style={{ margin: '3px 0' }}>Jumlah: </p>
//                             <p style={{ margin: '1px 0' }}>Metode : </p>
//                             {!sidebar?.reservasi && (
//                                 <>
//                                     <p style={{ margin: '1px 0' }}>Status : </p>
//                                     <p style={{ margin: '1px 0' }}>Sisa : </p>
//                                     <p style={{ margin: '1px 0' }}>Kembali :</p>
//                                 </>
//                             )}
//                         </div>
//                         <div style={{ textAlign: 'right' }}>
//                             <p style={{ margin: '3px 0' }}>{rupiahConverter(sidebar?.reservasi ? data?.dp : data?.bayar)}</p>
//                             <p style={{ margin: '1px 0' }}>{data?.cara_bayar}</p>
//                             {!sidebar?.reservasi && (
//                                 <>
//                                     <p style={{ margin: '1px 0' }}>{statusBayar}</p>
//                                     <p style={{ margin: '1px 0' }}>{rupiahConverter(data?.sisa_bayar)}</p>
//                                     <p style={{ margin: '1px 0' }}>{rupiahConverter(data?.kembalian)}</p>
//                                 </>
//                             )}
//                         </div>
//                     </div>
//                     {/* <p style={{ margin: '1px 0' }}>Jumlah : {rupiahConverter(sidebar?.reservasi ? data?.dp : data?.bayar)}</p>
//                     <p style={{ margin: '1px 0' }}>Metode : {data?.cara_bayar}</p>}
//                     {!sidebar?.reservasi && (
//                         <>
//                             <p style={{ margin: '1px 0' }}>Status : {statusBayar}</p>
//                             <p style={{ margin: '1px 0' }}>Sisa : {rupiahConverter(data?.sisa_bayar)}</p>
//                             <p style={{ margin: '1px 0' }}>Kembali : {rupiahConverter(data?.kembalian)}</p>
//                         </>
//                     )} */}
//                 </div>
//             </div>

//             {/* Tanda Tangan */}
//             {/* <div
//                 style={{
//                     marginTop: '25px',
//                     textAlign: 'right',
//                     paddingRight: '30px'
//                 }}
//             >
//                 <span style={{ fontSize: '10px', marginRight: '5px' }}>(Tanda Tangan)</span>
//                 <div
//                     style={{
//                         borderBottom: '1px solid #000',
//                         width: '60%',
//                         marginLeft: 'auto',
//                         marginTop: '25px',
//                         marginBottom: '5px',
//                         height: '20px'
//                     }}
//                 ></div>
//             </div> */}

//             {/* Footer */}
//             <div
//                 style={{
//                     textAlign: 'center',
//                     marginTop: '20px',
//                     paddingTop: '8px',
//                     // borderTop: '1px dashed #000',
//                     fontSize: '10px'
//                 }}
//             >
//                 <p style={{ margin: '3px 0' }}>Terima kasih atas kunjungan Anda</p>
//                 {/* <p style={{ margin: '3px 0' }}>Barang yang hilang menjadi tanggung jawab tamu</p> */}
//             </div>
//         </div>
//     );
// });

// export default PrintInvoice;

// Invoice.js untuk Printer Thermal 58mm
import { format } from 'date-fns';
import React from 'react';

const rupiahConverter = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};

const PrintInvoice = React.forwardRef(({ data, sidebar }, ref) => {
    // Render baris kamar dari data
    const kamarRows = data?.kamar?.map((item, index) => (
        <tr key={index}>
            <td style={{ textAlign: 'left', padding: '1px 0', fontSize: '7px' }}>{item.no_kamar}</td>
            <td style={{ textAlign: 'right', padding: '1px 0', fontSize: '7px' }}>{rupiahConverter(item.harga_kamar)}</td>
            <td style={{ textAlign: 'center', padding: '1px 0', fontSize: '7px' }}>{format(new Date(item.cek_in), 'yyyy-MM-dd HH:ii')}</td>
            {/* <td style={{ textAlign: 'center', padding: '1px 0', fontSize: '7px' }}>{item.cek_out}</td> */}
        </tr>
    ));

    // Perhitungan harga
    const hargaKamar = Number(data?.total_kamar) || 0;
    const dp = Number(data?.dp) || 0;
    const diskonPersen = Number(data?.disc) || 0;
    const ppnPersen = Number(data?.ppn) || 0;

    const hargaSetelahDP = hargaKamar - dp;
    const jumlahDiskon = (hargaSetelahDP * diskonPersen) / 100;
    const hargaSetelahDiskon = hargaSetelahDP - jumlahDiskon;
    const jumlahPPN = (hargaSetelahDiskon * ppnPersen) / 100;
    const hargaTotal = hargaSetelahDiskon + jumlahPPN;

    const statusBayar = data?.status_bayar === '1' ? 'Lunas' : 'Belum Lunas';

    return (
        <div ref={ref} style={{
            padding: '30px',
            fontFamily: 'monospace',
            fontSize: '25px',
            lineHeight: 1,
            maxWidth: '58mm',
            width: '100%'
        }}>
            {/* Header Invoice - Simplified */}
            <div style={{ textAlign: 'center', marginBottom: '2px' }}>
                <h4 style={{ margin: '1px 0', fontSize: '9px', fontWeight: 'bold' }}>{data?.nama_hotel}</h4>
                <p style={{ margin: '0px', fontSize: '7px' }}>{data?.alamat_hotel}</p>
                <p style={{ margin: '0px', fontSize: '7px' }}>{data?.no_telp_hotel}</p>
            </div>

            <hr style={{ margin: '2px 0', border: '0.5px solid #000' }} />

            {/* Informasi Invoice/Reservasi */}
            <div style={{ marginBottom: '2px' }}>
                {data?.kode_reservasi ? (
                    <>
                        <p style={{ margin: '1px 0', fontWeight: 'bold', fontSize: '8px' }}>RESERVASI: {data?.kode_reservasi}</p>
                        <p style={{ margin: '0px', fontSize: '7px' }}>TGL: {data?.tgl_reservasi}</p>
                    </>
                ) : (
                    <>
                        <p style={{ margin: '1px 0', fontWeight: 'bold', fontSize: '8px' }}>INVOICE: {data?.kode_invoice}</p>
                        <p style={{ margin: '0px', fontSize: '7px' }}>TGL: {data?.tgl_invoice}</p>
                    </>
                )}
            </div>

            {/* Informasi Tamu */}
            <div style={{ marginBottom: '3px' }}>
                <p style={{ margin: '1px 0', fontWeight: 'bold', fontSize: '8px' }}>Pemain:</p>
                <p style={{ margin: '0px', fontSize: '7px' }}>{data?.nama_tamu}</p>
                <p style={{ margin: '0px', fontSize: '7px' }}>NIP: {data?.nik}</p>
                <p style={{ margin: '0px', fontSize: '7px' }}>TELP: {data?.no_telepon}</p>
            </div>

            {/* Tabel Kamar - Compact */}
            <div style={{ marginBottom: '3px' }}>
                <p style={{ margin: '1px 0', fontWeight: 'bold', fontSize: '8px' }}>Meja:</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7px' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '0px', borderBottom: '1px solid #000' }}>Meja</th>
                            <th style={{ textAlign: 'right', padding: '0px', borderBottom: '1px solid #000' }}>Harga</th>
                            <th style={{ textAlign: 'center', padding: '0px', borderBottom: '1px solid #000' }}>Mulai</th>
                            {/* <th style={{ textAlign: 'center', padding: '0px', borderBottom: '1px solid #000' }}>Selesai</th> */}
                        </tr>
                    </thead>
                    <tbody>{kamarRows}</tbody>
                </table>
            </div>

            {/* Perhitungan - Compact */}
            <div style={{ marginBottom: '3px' }}>
                <p style={{ margin: '1px 0', fontWeight: 'bold', fontSize: '8px' }}>PERHITUNGAN:</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '7px' }}>Subtotal:</span>
                    <span style={{ fontSize: '7px' }}>{rupiahConverter(hargaKamar)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '7px' }}>DP:</span>
                    <span style={{ fontSize: '7px' }}>- {rupiahConverter(dp)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '7px' }}>Diskon ({diskonPersen}%):</span>
                    <span style={{ fontSize: '7px' }}>- {rupiahConverter(jumlahDiskon)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '7px' }}>PPN ({ppnPersen}%):</span>
                    <span style={{ fontSize: '7px' }}>+ {rupiahConverter(jumlahPPN)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #000', marginTop: '1px', paddingTop: '1px', fontWeight: 'bold' }}>
                    <span style={{ fontSize: '8px' }}>TOTAL:</span>
                    <span style={{ fontSize: '8px' }}>{rupiahConverter(hargaTotal)}</span>
                </div>
            </div>

            {/* Pembayaran - Compact */}
            <div style={{ marginBottom: '3px' }}>
                <p style={{ margin: '1px 0', fontWeight: 'bold', fontSize: '8px' }}>PEMBAYARAN:</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '7px' }}>Jumlah:</span>
                    <span style={{ fontSize: '7px' }}>{rupiahConverter(sidebar?.reservasi ? data?.dp : data?.bayar)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '7px' }}>Metode:</span>
                    <span style={{ fontSize: '7px' }}>{data?.cara_bayar}</span>
                </div>
                {!sidebar?.reservasi && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '7px' }}>Status:</span>
                            <span style={{ fontSize: '7px' }}>{statusBayar}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '7px' }}>Sisa:</span>
                            <span style={{ fontSize: '7px' }}>{rupiahConverter(data?.sisa_bayar)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '7px' }}>Kembali:</span>
                            <span style={{ fontSize: '7px' }}>{rupiahConverter(data?.kembalian)}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '3px', paddingTop: '2px', borderTop: '1px dashed #000' }}>
                <p style={{ margin: '1px 0', fontSize: '7px' }}>Terima kasih atas kunjungan Anda</p>
            </div>
        </div>
    );
});

export default PrintInvoice;