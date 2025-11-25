import { getSessionServerSide } from '../../../utilities/servertool';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect, useRef, useState } from 'react';
import { convertToISODate, formatDate, getUserName, rupiahConverter } from '../../../component/GeneralFunction/GeneralFunction';
import { Toast } from 'primereact/toast';
import postData from '../../../lib/Axios';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { Dialog } from 'primereact/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PrintInvoice from '../../component/printInvoice';
import { useReactToPrint } from 'react-to-print';
import PreviewCustom from '../../component/pdfExcelPrintCustom';
import { addPageInfo } from '../../../component/exportPDF/exportPDF';

export async function getSessionSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

const LaporanInvoice = (props) => {
    //state
    const strukRef = useRef(null);
    const toast = useRef(null);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [dataInvoice, setDataInvoice] = useState({
        data: [],
        dataPrint: [],
        load: false,
        tglLaporan: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)],
        searchVal: '',
        dataDetail: [],
        showDetail: false,
        showDelete: false,
        dataEdit: {}
    });

    const [dataRekap, setDataRekap] = useState({
        data: [],
        dataTotal: [],
        dataExcel: [],
        head: [],
        load: false,
        columnStyles: {},
        show: false,
        adjust: false,
        fileName: `laporan-invoice-${new Date().toISOString().slice(0, 10)}`,
        judul1: 'Laporan INVOICE',
        judul2: ''
    });

    const [pdf, setPdf] = useState({
        uri: '',
        show: false,
        load: false,
        data: {}
    });
    //

    //function
    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _filters = { ...filters };

        _filters['global'].value = value;

        setFilters(_filters);
        setDataInvoice((prev) => ({ ...prev, searchVal: value }));
    };

    const loadImageAsBase64 = (src) => {
        return new Promise((resolve, reject) => {
            fetch(src)
                .then((res) => res.blob())
                .then((blob) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
        });
    };

    const getDataInvoice = async () => {
        setDataInvoice((prev) => ({ ...prev, load: true, data: [] }));
        try {
            const [tgl_awal, tgl_akhir] = dataInvoice.tglLaporan.map((item) => {
                return convertToISODate(item);
            });

            const res = await postData('/api/invoice/laporan', { tgl_awal, tgl_akhir });
            const data = res.data.data;

            console.log(data);

            const processedData = data.map((invoice) => ({
                ...invoice,
                kamar_list: invoice.kamar.map((k) => k.no_kamar).join(', ')
            }));

            setDataInvoice((prev) => ({ ...prev, load: false, data: processedData, dataPrint: res.data.dataPrint }));
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setDataInvoice((prev) => ({ ...prev, load: false, data: [] }));
        }
    };

    const getDataPreview = async (data) => {
        setDataRekap((p) => ({ ...p, load: true }));
        try {
            const [tgl_awal, tgl_akhir] = dataInvoice.tglLaporan.map((item) => {
                return formatDate(item);
            });
            let judul = 'Laporan Transaksi Billiard'

            if (dataInvoice.dataPrint.length < 1) {
                showError('Data tidak ditemukan');
                return
            }

            let columnStyles = {
                // 2: { halign: 'right' },
                // 3: { halign: 'right' },
                // 4: { halign: 'right' },
                // 5: { halign: 'right' },
            }

            setDataRekap(p => ({
                ...p,
                data: dataInvoice.dataPrint,
                // dataExcel: dataInvoice.dataExcel,
                show: true,
                adjust: true,
                columnStyles,
                judul1: judul,
                judul2: 'Antara Tanggal ' + tgl_awal + ' - ' + tgl_akhir
            }))
        } catch (error) {
            setDataRekap((p) => ({ ...p, data: [] }));
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        } finally {
            setDataRekap((p) => ({ ...p, load: false }));
        }
    }

    const getDataPdf = async (kode_invoice) => {
        setPdf((prev) => ({ ...prev, load: true }));
        try {
            const res = await postData('/api/invoice/get-pdf', { kode_invoice });
            const data = res.data.data;

            console.log(data);
            // printPdf(data);
            // setPdf((prev) => ({ ...prev, show: true, load: false }));

            await getBase64ImageResolution(data.logo_hotel).then(({ width, height }) => {
                console.log(`Resolusi gambar: ${width}x${height}`);

                if (width > 500 || height > 500) {
                    showError('Resolusi logo terlalu besar, sebaiknya resize ke <500x500 px');
                    return;
                }
            });

            setPdf((prev) => ({ ...prev, show: true, data: data }));
            setTimeout(() => {
                handlePrint();
            }, 500);
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setPdf((prev) => ({ ...prev, show: false, load: false }));
        } finally {
            setPdf((prev) => ({ ...prev, load: false }));
        }
    };

    const handleDelete = async () => {
        try {
            const res = await postData('/api/invoice/delete', { kode: dataInvoice.dataEdit.kode_invoice });
            showSuccess(res.data.message);
            setDataInvoice((p) => ({ ...p, showDelete: false, dataEdit: {} }));
            getDataInvoice();
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        }
    };

    const handleCheckout = async (kode_kamar) => {
        setDataInvoice((prev) => ({ ...prev, load: true }));
        try {
            const [tgl_awal, tgl_akhir] = dataInvoice.tglLaporan.map((item) => {
                return convertToISODate(item);
            });

            const res = await postData('/api/invoice/checkout', { kode_kamar, tgl_awal, tgl_akhir });
            const data = res.data.data;
            console.log(data);

            setDataInvoice((prev) => ({ ...prev, load: false, data: data, showDetail: false }));
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setDataInvoice((prev) => ({ ...prev, load: false }));
        }
    };

    const getBase64ImageResolution = (base64) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = base64;
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = reject;
        });
    };

    const handlePrint = useReactToPrint({
        contentRef: strukRef,
        documentTitle: 'Invoice'
    });

    useEffect(() => {
        getDataInvoice();
    }, []);
    //

    const handleCustomTable = async ({ doc, marginTopInMm = 10, marginLeftInMm = 10, marginRightInMm = 10, marginBottomInMm = 10 }) => {
        const row = dataRekap.data
        // Left margin
        let y = marginTopInMm;
        const left = marginLeftInMm;
        const lineHeight = 6;
        const vaData1 = (dataRekap.data)

        const userName = await getUserName()

        const tableHead1 = Object.keys(vaData1[0]).filter(v => v !== 'Jenis');

        const tableData1 = vaData1.map(row =>
            Object.entries(row)
                .filter(([key]) => key !== 'Jenis') // buang field 'Jenis'
                .map(([, value]) => value)          // ambil hanya value-nya
        );

        doc.autoTable({
            startY: 45 + y,
            head: [tableHead1],
            body: tableData1,
            theme: 'plain',
            margin: {
                top: marginTopInMm,
                left: marginLeftInMm,
                right: marginRightInMm,
                bottom: marginBottomInMm + 10
            },
            styles: {
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontSize: 8
            },
            columnStyles: {
                ...dataRekap?.columnStyles,
            },

            headerStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center'
            },
            didParseCell: function (data) {
                if (data.section === 'body') {
                    const text = String(data.cell.raw || '').toUpperCase();

                    const boldKeywords = [
                        'ASET', 'KEWAJIBAN DAN MODAL',
                        'TOTAL ASET', 'TOTAL KEWAJIBAN DAN MODAL'
                    ];

                    const original = tableData1.find(v => v.Kode === row.Kode);

                    if (
                        // boldKeywords.some(keyword => text.includes(keyword)) ||
                        (original && original.Jenis && original.Jenis == 'Y')
                    ) {
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            },
            didDrawPage: (data) => {
                addPageInfo(doc, userName, marginRightInMm);
            }
        });

        const finalY = doc.lastAutoTable.finalY;
        y += finalY

        y += doc.lastAutoTable.finalY - 100
        return y
    };

    // //template
    // const headerTemplate = () => {
    //     return (
    //         <>
    //             <div className="flex justify-content-between">
    //                 <div className="p-inputgroup" style={{ width: '50%' }}>
    //                     <Calendar
    //                         dateFormat="yy-mm-dd"
    //                         value={dataInvoice.tglLaporan[0]}
    //                         onChange={(e) => {
    //                             console.log(e.value);
    //                             setDataInvoice((prev) => ({ ...prev, tglLaporan: [e.value, prev.tglLaporan[1]] }));
    //                         }}
    //                         readOnlyInput
    //                     />

    //                     <Calendar
    //                         dateFormat="yy-mm-dd"
    //                         value={dataInvoice.tglLaporan[1]}
    //                         onChange={(e) => {
    //                             console.log(e.value);
    //                             setDataInvoice((prev) => ({ ...prev, tglLaporan: [prev.tglLaporan[0], e.value] }));
    //                         }}
    //                         readOnlyInput
    //                     />

    //                     <Button icon="pi pi-search" onClick={() => getDataInvoice()} />
    //                     <Button severity='info' icon="pi pi-book" label='Preview' onClick={() => getDataPreview()} />
    //                 </div>
    //                 <InputText value={dataInvoice.searchVal} placeholder="Search" onChange={onGlobalFilterChange} />
    //             </div>
    //         </>
    //     );
    // };

    const headerTemplate = () => {
        return (
            <div className="grid grid-nogutter align-items-center justify-content-between mb-3">
                {/* Left Section - Date Range */}
                <div className="col-12 md:col-6 lg:col-6">
                    <div className="flex flex-column gap-2">
                        <label htmlFor="date-range" className="font-semibold text-sm">
                            Periode Laporan
                        </label>
                        <div className="flex align-items-center gap-2">
                            <Calendar
                                id="date-range"
                                dateFormat="yy-mm-dd"
                                value={dataInvoice.tglLaporan[0]}
                                onChange={(e) => {
                                    setDataInvoice((prev) => ({
                                        ...prev,
                                        tglLaporan: [e.value, prev.tglLaporan[1]]
                                    }));
                                }}
                                placeholder="Tanggal Mulai"
                                readOnlyInput
                                showIcon
                                className="flex-1"
                            />
                            <span className="">s/d</span>
                            <Calendar
                                dateFormat="yy-mm-dd"
                                value={dataInvoice.tglLaporan[1]}
                                onChange={(e) => {
                                    setDataInvoice((prev) => ({
                                        ...prev,
                                        tglLaporan: [prev.tglLaporan[0], e.value]
                                    }));
                                }}
                                placeholder="Tanggal Akhir"
                                readOnlyInput
                                showIcon
                                className="flex-1"
                            />
                            <Button
                                icon="pi pi-search"
                                onClick={() => getDataInvoice()}
                                tooltip="Cari Data"
                                tooltipOptions={{ position: 'top' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Section - Actions and Search */}
                <div className="col-12 md:col-6 lg:col-6">
                    <div className="flex flex-column md:flex-row gap-3 justify-content-end">
                        {/* Preview Button */}
                        <div className="flex align-items-end">
                            <Button
                                severity='info'
                                icon="pi pi-book"
                                label='Preview Laporan'
                                onClick={() => getDataPreview()}
                                className="w-full md:w-auto"
                            />
                        </div>

                        {/* Global Search */}
                        <div className="flex flex-column gap-2 flex-1 md:max-w-20rem">
                            <label htmlFor="global-search" className="font-semibold text-sm">
                                Cari Data
                            </label>
                            <InputText
                                id="global-search"
                                value={dataInvoice.searchVal}
                                placeholder="Cari berdasarkan NIP, Nama, No. Telepon, Kode Invoice..."
                                onChange={onGlobalFilterChange}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const invoiceAction = (rowData) => {
        return (
            <>
                <Button
                    loading={dataInvoice.load}
                    label={rowData.status == 0 ? 'Sudah Checkout' : 'Checkout'}
                    severity={rowData.status == 0 ? 'success' : 'danger'}
                    disabled={rowData.status == 0 ? true : false}
                    onClick={rowData.status == 0 ? '' : () => handleCheckout(rowData.kode_kamar)}
                />
            </>
        );
    };
    //

    const footerDeleteTemplate = (
        <div>
            <Button label="No" icon="pi pi-times" onClick={() => setDataInvoice((p) => ({ ...p, showDelete: false, dataEdit: {} }))} className="p-button-text" />
            <Button label="Yes" icon="pi pi-check" onClick={() => handleDelete()} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <div className="card">
                <div className="flex align-items-center justify-content-between mb-4">
                    <div>
                        <h4 className="m-0">Laporan Invoice</h4>
                    </div>
                    {/* <Button
                        icon="pi pi-refresh"
                        // rounded
                        // outlined
                        onClick={getDataInvoice}
                        tooltip="Refresh Data"
                        tooltipOptions={{ position: 'left' }}
                    /> */}
                </div>
                <DataTable value={dataInvoice.data} size="small" filters={filters} globalFilterFields={['nik', 'nama_tamu', 'no_telepon', 'kode_invoice', 'kamar_list']} loading={dataInvoice.load} paginator rows={10} header={headerTemplate}>
                    <Column field="kode_invoice" header="Kode Invoice"></Column>
                    <Column field="kamar_list" header="Meja dipakai"></Column>
                    <Column field="nik" header="NIP"></Column>
                    <Column field="nama_tamu" header="Nama"></Column>
                    <Column field="no_telepon" header="No Telepon"></Column>
                    <Column field="total_kamar" header="Total Meja" body={(rowData) => rupiahConverter(rowData.total_kamar)}></Column>
                    {/* <Column field="total_harga_real" header="Total Harga Asli" body={(rowData) => rupiahConverter(rowData.total_harga_real)}></Column> */}
                    <Column field="dp" header="Total DP" body={(rowData) => rupiahConverter(rowData.dp)}></Column>
                    {/* <Column field="total_bayar_tersisa" header="Total Bayar Yang Tersisa" body={(rowData) => rupiahConverter(rowData.total_bayar_tersisa)}></Column> */}
                    <Column field="bayar" header="Bayar" body={(rowData) => rupiahConverter(rowData.bayar)}></Column>
                    <Column field="sisa_bayar" header="Sisa Bayar" body={(rowData) => rupiahConverter(rowData.sisa_bayar)}></Column>
                    <Column field="cara_bayar" header="Metode Pembayaran"></Column>
                    <Column field="status_bayar" header="Status Bayar" body={(rowData) => <span className={rowData.status_bayar == '1' ? 'text-green-600' : 'text-red-600'}>{rowData.status_bayar > 0 ? 'Lunas' : 'Belum Lunas'}</span>}></Column>
                    <Column
                        header="Action"
                        body={(rowData) => {
                            return (
                                <div className="flex gap-1">
                                    <Button icon="pi pi-trash" tooltipOptions={{ position: 'top' }} tooltip="Hapus Transaksi" severity="danger" onClick={() => setDataInvoice((prev) => ({ ...prev, showDelete: true, dataEdit: rowData }))} />
                                    <Button icon="pi pi-file" tooltipOptions={{ position: 'top' }} tooltip="Cek Meja" onClick={() => setDataInvoice((prev) => ({ ...prev, showDetail: true, dataDetail: rowData.kamar }))} />
                                    <Button icon="pi pi-print" tooltipOptions={{ position: 'top' }} tooltip="Print ulang" severity="warning" loading={pdf.load} onClick={() => getDataPdf(rowData.kode_invoice)} />
                                </div>
                            );
                        }}
                    ></Column>
                </DataTable>
            </div>

            <Dialog visible={dataInvoice.showDetail} onHide={() => setDataInvoice((prev) => ({ ...prev, showDetail: false, dataDetail: [] }))} style={{ width: '80%' }}>
                <DataTable value={dataInvoice.dataDetail}>
                    <Column field="no_kamar" header="Meja"></Column>
                    <Column field="harga_kamar" header="Harga Meja" body={(rowData) => rupiahConverter(rowData.harga_kamar)}></Column>
                    <Column field="cek_in" header="Mulai"></Column>
                    <Column field="cek_out" header="Selesai"></Column>
                    <Column body={invoiceAction}></Column>
                </DataTable>
            </Dialog>


            <Dialog header="Delete" visible={dataInvoice.showDelete} onHide={() => setDataInvoice((p) => ({ ...p, showDelete: false, dataEdit: {} }))} footer={footerDeleteTemplate}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>
                        are you sure you want to delete <strong>{dataInvoice.dataEdit?.kode_invoice}</strong>
                    </span>
                </div>
            </Dialog>

            <div style={{ display: 'none' }}>
                <PrintInvoice
                    ref={strukRef}
                    sidebar={{
                        laporan: false,
                        reservasi: false
                    }}
                    data={pdf.data}
                />
            </div>

            <PreviewCustom dataRekap={dataRekap} setDataRekap={setDataRekap} toast={toast} handleCustomTable={handleCustomTable} pdfOnly={false} />

        </>
    );
};

export default LaporanInvoice;
