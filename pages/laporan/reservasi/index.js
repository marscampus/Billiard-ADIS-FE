import { getSessionServerSide } from '../../../utilities/servertool';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect, useRef, useState } from 'react';
import { convertToISODate, rupiahConverter } from '../../../component/GeneralFunction/GeneralFunction';
import { Toast } from 'primereact/toast';
import postData from '../../../lib/Axios';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { Dialog } from 'primereact/dialog';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import { useReactToPrint } from 'react-to-print';
import PrintInvoice from '../../component/printInvoice';
import { Image as PrimeImage } from 'primereact/image';

export async function getSessionSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

const LaporanReservasi = (props) => {
    //state
    const strukRef = useRef(null);

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [dataReservasi, setDataReservasi] = useState({
        data: [],
        load: false,
        tglLaporan: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)],
        searchVal: '',
        dataDetail: [],
        showDetail: false,
        delete: false,
        showDelete: false,
        dataEdit: {}
    });
    const toast = useRef(null);

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
        setDataReservasi((prev) => ({ ...prev, searchVal: value }));
    };

    const getDataReservasi = async () => {
        setDataReservasi((prev) => ({ ...prev, load: true, data: [] }));
        try {
            const [tgl_awal, tgl_akhir] = dataReservasi.tglLaporan.map((item) => {
                return convertToISODate(item);
            });

            const res = await postData('/api/reservasi/laporan', { tgl_awal, tgl_akhir });
            const data = res.data.data;

            console.log(data);

            setDataReservasi((prev) => ({ ...prev, load: false, data: data }));
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setDataReservasi((prev) => ({ ...prev, load: false, data: [] }));
        }
    };

    const handleDelete = async () => {
        try {
            const res = await postData('/api/reservasi/delete', { kode: dataReservasi.dataEdit.kode_reservasi });
            showSuccess(res.data.message);
            setDataReservasi((p) => ({ ...p, showDelete: false, dataEdit: {} }));
            getDataReservasi();
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        }
    };

    const getDataPdf = async (kode_reservasi) => {
        setPdf((prev) => ({ ...prev, load: true }));

        try {
            const res = await postData('/api/reservasi/get-pdf', { kode_reservasi });
            const data = res.data.data;

            console.log(data);
            // printPdf(data);
            // setPdf((prev) => ({ ...prev, show: true }));

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
        } finally {
            setPdf((prev) => ({ ...prev, load: false }));
        }
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

    const handlePrint = useReactToPrint({
        contentRef: strukRef,
        documentTitle: 'Invoice'
    });

    const getBase64ImageResolution = (base64) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = base64;
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = reject;
        });
    };

    useEffect(() => {
        getDataReservasi();
    }, []);
    //

    //template
    const headerTemplate = () => {
        return (
            <>
                <div className="flex justify-content-between">
                    <div className="p-inputgroup" style={{ width: '50%' }}>
                        <Calendar
                            dateFormat="yy-mm-dd"
                            value={dataReservasi.tglLaporan[0]}
                            onChange={(e) => {
                                console.log(e.value);
                                setDataReservasi((prev) => ({ ...prev, tglLaporan: [e.value, prev.tglLaporan[1]] }));
                            }}
                            readOnlyInput
                        />

                        <Calendar
                            dateFormat="yy-mm-dd"
                            value={dataReservasi.tglLaporan[1]}
                            onChange={(e) => {
                                console.log(e.value);
                                setDataReservasi((prev) => ({ ...prev, tglLaporan: [prev.tglLaporan[0], e.value] }));
                            }}
                            readOnlyInput
                        />

                        <Button icon="pi pi-search" onClick={() => getDataReservasi()} />
                    </div>
                    <InputText value={dataReservasi.searchVal} placeholder="Search" onChange={onGlobalFilterChange} />
                </div>
            </>
        );
    };

    const footerDeleteTemplate = (
        <div>
            <Button label="No" icon="pi pi-times" onClick={() => setDataReservasi((p) => ({ ...p, showDelete: false, dataEdit: {} }))} className="p-button-text" />
            <Button label="Yes" icon="pi pi-check" onClick={() => handleDelete()} />
        </div>
    );

    const imageBodyTemplate = (rowData) => {
        return (
            <>
                <PrimeImage
                    src={rowData.bukti_pembayaran || `/layout/images/no_img.jpg`}
                    width={80}
                    height={80}
                    preview
                    style={{
                        borderRadius: '6px',
                        height: '80px',
                        width: '80px',
                        objectPosition: 'center',
                        objectFit: 'cover',
                        boxShadow: '0px 0px 3px 1px rgba(107,102,102,0.35)'
                    }}
                />
            </>
        );
    };


    return (
        <>
            <Toast ref={toast} />
            <div className="card">
                <h4>Laporan Reservasi</h4>
                <DataTable value={dataReservasi.data} filters={filters} globalFilterFields={['nik', 'nama_tamu', 'no_telepon', 'kode_reservasi']} loading={dataReservasi.load} header={headerTemplate}>
                    <Column field="kode_reservasi" header="Kode Reservasi"></Column>
                    <Column field="nik" header="KTP"></Column>
                    <Column field="nama_tamu" header="Nama"></Column>
                    <Column field="no_telepon" header="No Telepon"></Column>
                    {/* <Column field="dp" header="DP" body={(rowData) => rupiahConverter(rowData.dp)}></Column> */}
                    <Column field="total_harga" header="Total Harga" body={(rowData) => rupiahConverter(rowData.total_harga)}></Column>
                    <Column field="cara_bayar" header="Metode Pembayaran"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="foto" body={imageBodyTemplate} header="Bukti Pembayaran"></Column>
                    <Column
                        body={(rowData) => {
                            return (
                                <div className="flex gap-1">
                                    <Button icon="pi pi-trash" severity="danger" onClick={() => setDataReservasi((prev) => ({ ...prev, showDelete: true, dataEdit: rowData }))} />
                                    <Button icon="pi pi-file" onClick={() => setDataReservasi((prev) => ({ ...prev, showDetail: true, dataDetail: rowData.kamar }))} />
                                    <Button icon="pi pi-print" loading={pdf.load} severity="warning" onClick={() => getDataPdf(rowData.kode_reservasi)} />
                                </div>
                            );
                        }}
                    ></Column>
                </DataTable>
            </div>
            <Dialog visible={dataReservasi.showDetail} onHide={() => setDataReservasi((prev) => ({ ...prev, showDetail: false, dataDetail: [] }))} style={{ width: '80%' }}>
                <DataTable value={dataReservasi.dataDetail}>
                    <Column field="no_kamar" header="Meja"></Column>
                    <Column field="harga_kamar" header="Harga Meja" body={(rowData) => rupiahConverter(rowData.harga_kamar)}></Column>
                    <Column field="cek_in" header="Mulai Main"></Column>
                    <Column field="cek_out" header="Selesai Main"></Column>
                </DataTable>
            </Dialog>

            {/* <Dialog visible={pdf.show} style={{ width: '50vw' }} onHide={() => setPdf((prev) => ({ ...prev, show: false }))} breakpoints={{ '960px': '75vw', '641px': '100vw' }}>
                <iframe src={pdf.uri} width="100%" style={{ height: '100vh' }}></iframe>
            </Dialog> */}

            <Dialog header="Delete" visible={dataReservasi.showDelete} onHide={() => setDataReservasi((p) => ({ ...p, showDelete: false, dataEdit: {} }))} footer={footerDeleteTemplate}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>
                        are you sure you want to delete <strong>{dataReservasi.dataEdit?.kode_reservasi}</strong>
                    </span>
                </div>
            </Dialog>

            <div style={{ display: 'none' }}>
                <PrintInvoice
                    ref={strukRef}
                    sidebar={{
                        laporan: false,
                        reservasi: true
                    }}
                    data={pdf.data}
                />
            </div>
        </>
    );
};

export default LaporanReservasi;
