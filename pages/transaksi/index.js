import { useContext, useEffect, useRef, useState } from 'react';
import { getSessionServerSide } from '../../utilities/servertool';
import { TabView, TabPanel } from 'primereact/tabview';
import { Sidebar } from 'primereact/sidebar';
import { DataView } from 'primereact/dataview';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Chip } from 'primereact/chip';
import { Skeleton } from 'primereact/skeleton';
import { Toast } from 'primereact/toast';
import postData from '../../lib/Axios';
import { convertToISODate, rupiahConverter } from '../../component/GeneralFunction/GeneralFunction';
import { useFormik } from 'formik';
import { InputNumber } from 'primereact/inputnumber';
import { Tooltip } from 'primereact/tooltip';
import { Badge } from 'primereact/badge';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Panel } from 'primereact/panel';
import { Checkbox } from 'primereact/checkbox';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RadioButton } from 'primereact/radiobutton';
import { Menu } from 'primereact/menu';
import { FilterMatchMode } from 'primereact/api';
import { useReactToPrint } from 'react-to-print';
import SesiJual from './sesiJual';
import PrintInvoice from '../component/printInvoice';
import { LayoutContext } from '../../layout/context/layoutcontext';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function DashboardDua(props) {
    // state
    const toast = useRef(null);
    const strukRef = useRef(null);
    const { onMenuToggle } = useContext(LayoutContext);

    const [dataDash, setDataDash] = useState({
        data: [],
        load: false,
        filterValue: '',
        filteredData: [],
        ppn: 0
    });

    const [sidebar, setSidebar] = useState({
        data: {},
        load: false,
        showBar: false,
        edit: false,
        reservasi: false,
        laporan: false
    });

    const [dataPenginap, setDataPenginap] = useState({
        data: [],
        show: false,
        load: false,
        totData: 0,
        tglLaporan: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)],
        searchVal: '',
        filters: { global: { value: null, matchMode: FilterMatchMode.CONTAINS } }
    });

    const [dataReservasi, setDataReservasi] = useState({
        data: [],
        show: false,
        load: false,
        selected: null,
        searchVal: '',
        filters: { global: { value: null, matchMode: FilterMatchMode.CONTAINS } }
    });

    const [pembayaran, setPembayaran] = useState({
        options: []
    });

    const [pdf, setPdf] = useState({
        uri: '',
        show: false,
        load: false,
        data: {}
    });

    const [shiftDialog, setShiftDialog] = useState(true);
    const [selectedSesi, setSelectedSesi] = useState({});
    //

    //function

    const handleSesiSelect = async (sesi) => {
        formik.setFieldValue('sesi_jual', sesi?.SESIJUAL);
        setSelectedSesi(sesi);
        console.log(sesi);
    };

    const hideDialog = () => {
        setShiftDialog(false);
    };

    const filterSearch = (searchVal) => {
        const regex = searchVal ? new RegExp(searchVal, 'i') : null;

        // Jika tidak ada teks pencarian, kembalikan data asli
        const filtered = !searchVal
            ? dataDash.data
            : dataDash.data.map((item) => ({
                ...item,
                kamar: regex ? item.kamar.filter((k) => regex.test(k.no_kamar)) : item.kamar
            }));

        setDataDash((prev) => ({
            ...prev,
            filteredData: filtered,
            filterValue: searchVal
        }));
    };

    const showSuccess = (detail) => {
        toast.current?.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current?.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const getDataDash = async () => {
        setDataDash((prev) => ({ ...prev, load: true }));
        try {
            const res = await postData('/api/dashboard/get', {});
            formik.setFieldValue('ppn', res.data.ppn);
            setDataDash((prev) => ({ ...prev, data: res.data.data, load: false, ppn: res.data.ppn }));
            setPembayaran((prev) => ({ ...prev, options: res.data.dataPembayaran }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setDataDash((prev) => ({ ...prev, data: [], load: false }));
        }
    };

    const getDataPenginap = async () => {
        setDataPenginap((prev) => ({ ...prev, load: true }));
        try {
            const [tgl_awal, tgl_akhir] = dataPenginap.tglLaporan.map((item) => {
                return convertToISODate(item);
            });

            const res = await postData('/api/invoice/laporan', { tgl_awal, tgl_akhir });
            const data = res.data.data;

            const processedData = data.map((p) => ({
                ...p,
                kamar_list: p.kamar.map((k) => k.no_kamar).join(', ')
            }));

            setDataPenginap((prev) => ({ ...prev, data: processedData, totData: res.data.totData, load: false }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setDataPenginap((prev) => ({ ...prev, data: [], load: false }));
        }
    };

    const formik = useFormik({
        initialValues: {
            id: '',
            nik: '',
            nama: '',
            kamar: [],
            no_telp: '',
            dp: 0,
            bayar: 0,
            bayar_old: 0,
            total_harga: 0,
            total_kamar: 0,
            disc: 0,
            ppn: 0,
            kode_reservasi: '',
            kode_invoice: '',
            metode_pembayaran: 'Tunai',
            sisa_bayar: 0,
            status_bayar: '',
            tgl_invoice: '',
            kembalian: 0,
            total_bayar: 0,
            sesi_jual: ''
        },
        validate: (data) => {
            let errors = {};

            // Validasi untuk field utama
            !data.nama && (errors.nama = 'Nama pemain tidak boleh kosong.');
            !data.no_telp && (errors.no_telp = 'No telp pemain tidak boleh kosong.');
            !data.nik && (errors.nik = 'KTP pemain tidak boleh kosong.');

            // Validasi untuk kamar
            errors.kamar = []; // Inisialisasi sebagai array kosong

            if (data.kamar && Array.isArray(data.kamar)) {
                data.kamar.forEach((kamar, index) => {
                    const error = {};
                    if (!kamar.cek_in) {
                        error.cek_in = 'Tanggal Checkin wajib diisi';
                    }
                    if (!kamar.cek_out) {
                        error.cek_out = 'Tanggal Checkout wajib diisi';
                    }

                    const cekInDate = new Date(kamar.cek_in);
                    const cekOutDate = new Date(kamar.cek_out);

                    if (sidebar.reservasi) {
                        if (kamar.per_harga != 'Jam') {
                            if (cekInDate.getTime() === cekOutDate.getTime()) {
                                error.cek_out = 'Tanggal Checkout tidak boleh sama dengan Checkin';
                            }
                        }
                    }

                    if (cekOutDate.getTime() < cekInDate.getTime()) {
                        error.cek_out = 'Tanggal Checkout tidak boleh lebih awal dari Checkin';
                    }

                    errors.kamar[index] = Object.keys(error).length > 0 ? error : {}; // Pastikan array tetap terisi
                });
            }

            if (errors.kamar.every((item) => Object.keys(item).length === 0)) {
                delete errors.kamar;
            }

            return errors;
        },
        onSubmit: (data) => {
            handleSave(data);
        }
    });

    const handleSave = async (input) => {
        setSidebar((prev) => ({ ...prev, load: true }));
        try {
            let endpoint = '';

            let body = {
                nama_tamu: input.nama,
                no_telepon: input.no_telp,
                nik: input.nik,
                kamar: input.kamar,
                total_kamar: input.total_kamar,
                sesi_jual: selectedSesi?.SESIJUAL
            };

            if (sidebar.reservasi) {
                endpoint = '/api/reservasi/store';
                body.dp = input.dp;
                body.total_harga = input.total_kamar;
                body.metode_pembayaran = input.metode_pembayaran;
            } else if (sidebar.laporan) {
                endpoint = '/api/invoice/pay';
                body.total_harga = input.total_harga;
                body.kode_reservasi = input.kode_reservasi;
                body.bayar = input.bayar;
                body.metode_pembayaran = input.metode_pembayaran;
                body.dp = input.dp;
                body.disc = input.disc;
                body.ppn = input.ppn;
                body.kode_invoice = input.kode_invoice;
                body.kembalian = input.kembalian;
                body.sisa_bayar = input.sisa_bayar;
                body.status_bayar = input.status_bayar;
            } else {
                endpoint = '/api/invoice/store';
                body.total_harga = input.total_harga;
                body.kode_reservasi = input.kode_reservasi;
                body.dp = input.dp;
                body.total_harga = input.total_harga;
                body.bayar = input.bayar;
                body.metode_pembayaran = input.metode_pembayaran;
                body.dp = input.dp;
                body.disc = input.disc;
                body.ppn = input.ppn;
                body.kembalian = input.kembalian;
                body.sisa_bayar = input.sisa_bayar;
                body.status_bayar = input.status_bayar;
            }

            // return console.log(body);
            const res = await postData(endpoint, body);
            showSuccess(res.data.message);

            if (!sidebar.reservasi || sidebar.laporan) {
                getDataPdf(res.data.kode_invoice, true);
            } else {
                getDataPdf(res.data.kode_reservasi, false);
            }

            formik.resetForm();
            getDataPenginap();
            getDataReservasi();
            getDataDash();
            formik.setFieldValue('sesi_jual', selectedSesi?.SESIJUAL);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        } finally {
            setSidebar((prev) => ({ ...prev, showBar: false, load: false }));
        }
    };

    const isFormFieldInvalid = (name) => !!(formik.touched[name] && formik.errors[name]);

    const getFormErrorMessage = (name) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{formik.errors[name]}</small> : <small className="p-error">&nbsp;</small>;
    };

    const getDataReservasi = async () => {
        setDataReservasi((prev) => ({ ...prev, load: true, data: [] }));
        try {
            const res = await postData('/api/reservasi/get-data', {});
            const data = res.data.data;

            setDataReservasi((prev) => ({ ...prev, load: false, data: data }));
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setDataReservasi((prev) => ({ ...prev, load: false, data: [] }));
        }
    };

    const getDataPdf = async (kode_data, pdfInvoice = true) => {
        setPdf((prev) => ({ ...prev, load: true }));

        try {
            let endpoint = pdfInvoice ? '/api/invoice/get-pdf' : '/api/reservasi/get-pdf';
            let kode = pdfInvoice ? { kode_invoice: kode_data } : { kode_reservasi: kode_data };

            // return console.log(endpoint);
            const res = await postData(endpoint, kode);
            const data = res.data.data;

            console.log(data);
            // printPdf(data);
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

    const calculateTotalKamar = (kamar) => {
        if (!kamar || !Array.isArray(kamar)) return 0;

        return kamar.reduce((total, kamar) => {
            const cekInDate = new Date(kamar.cek_in);
            const cekOutDate = new Date(kamar.cek_out);

            if (isNaN(cekInDate.getTime()) || isNaN(cekOutDate.getTime())) {
                return total;
            }

            const tipeHarga = kamar.per_harga;

            cekInDate.setSeconds(0, 0);
            cekOutDate.setSeconds(0, 0);

            const differenceInTime = cekOutDate - cekInDate;

            let hargaKamar = 0;

            switch (tipeHarga) {
                case 'Malam': {
                    // Per malam: hitung hari
                    const days = differenceInTime / (1000 * 60 * 60 * 24);
                    const adjustedDays = days > 1 ? Math.ceil(days) : 1; // Minimal 1 malam, lebih dari 1 dihitung lebih
                    hargaKamar = adjustedDays * kamar.harga_kamar;
                    break;
                }
                case 'Jam': {
                    // Per jam: hitung jam
                    const hours = differenceInTime / (1000 * 60 * 60);
                    const adjustedHours = hours > 1 ? Math.ceil(hours) : 1; // Minimal 1 jam, lebih dari 1 dihitung lebih
                    hargaKamar = adjustedHours * kamar.harga_kamar;
                    break;
                }
                case 'Minggu': {
                    // Per minggu: hitung minggu
                    const weeks = differenceInTime / (1000 * 60 * 60 * 24 * 7);
                    const adjustedWeeks = weeks > 1 ? Math.ceil(weeks) : 1; // Minimal 1 minggu, lebih dari 1 dihitung lebih
                    hargaKamar = adjustedWeeks * kamar.harga_kamar;
                    break;
                }
                case 'Bulan': {
                    // Per bulan: hitung bulan
                    const months = cekOutDate.getMonth() - cekInDate.getMonth() + (cekOutDate.getFullYear() - cekInDate.getFullYear()) * 12;
                    const remainingDays = cekOutDate.getDate() - cekInDate.getDate();
                    const adjustedMonths = months + (remainingDays > 0 ? 1 : 0); // Tambah 1 jika ada hari lebih
                    hargaKamar = Math.max(1, adjustedMonths) * kamar.harga_kamar;

                    break;
                }
                case 'Event': {
                    // Per event: hitung event
                    hargaKamar = kamar.harga_kamar;
                    break;
                }
                default:
                    return total;
            }

            return total + hargaKamar;
        }, 0);
    };

    const calculateTotalHarga = (totKamar, discPer, ppnPer, dp) => {
        const hargaKamar = Number(totKamar) || 0;
        const discPers = Number(discPer) || 0;
        const ppnPers = Number(ppnPer) || 0;
        const _dp = Number(dp) || 0;

        if (hargaKamar <= 0) {
            formik.setFieldValue('total_harga', 0);
            return;
        }

        // Kurangi DP dari harga kamar
        const hargaSetelahDP = Math.max(hargaKamar - _dp, 0);

        // Hitung diskon dan PPN berdasarkan harga setelah DP
        const hargaSetelahDiskon = hargaSetelahDP - hargaSetelahDP * (discPers / 100);
        const hargaSetelahPPN = hargaSetelahDiskon + hargaSetelahDiskon * (ppnPers / 100);

        // Hasil akhir
        formik.setFieldValue('total_harga', hargaSetelahPPN);
        formik.setFieldValue('bayar', hargaSetelahPPN);
    };

    const calculateBayar = (hargaTot, bayar, bayarOld = 0) => {
        let kembalian = 0;
        let sisaBayar = 0;

        const totalBayar = bayarOld + bayar;

        if (totalBayar > hargaTot) {
            kembalian = totalBayar - hargaTot;
        } else {
            sisaBayar = hargaTot - totalBayar;
        }

        const statusBayar = sisaBayar < 1 ? '1' : '0';

        formik.setValues((p) => ({
            ...p,
            sisa_bayar: sisaBayar,
            kembalian: kembalian,
            status_bayar: statusBayar,
            total_bayar: totalBayar
        }));
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
        getDataDash();
        getDataReservasi();
        getDataPenginap();
        onMenuToggle();
    }, []);

    useEffect(() => {
        const { total_harga, bayar, bayar_old } = formik.values;

        if (sidebar.laporan) {
            calculateBayar(total_harga, bayar, bayar_old);
        } else {
            calculateBayar(total_harga, bayar);
        }
    }, [formik.values.total_harga, formik.values.bayar, formik.values.bayar_old, sidebar.laporan]);

    useEffect(() => {
        calculateTotalHarga(formik.values.total_kamar, formik.values.disc, formik.values.ppn, formik.values.dp);
    }, [formik.values.ppn, formik.values.total_kamar, formik.values.dp, formik.values.disc]);
    //

    // template
    const itemKamarTemplate = (data) => {
        return (
            <div className="col-12 sm:col-6 lg:col-4 xl:col-3 p-1 p-relative">
                <div className="border-1 surface-border surface-card border-round p-2 relative">
                    {data.status_kamar == 1 ? (
                        <Chip label={'Sedang Digunakan'} style={{ borderRadius: '3px', backgroundColor: 'rgb(248, 27, 27)', position: 'absolute', top: '0', right: '0', color: 'rgb(255,255,255)', border: '1px solid rgb(255,255,255)' }} />
                    ) : (
                        ''
                    )}
                    <div className="flex flex-column align-items-center">
                        <img
                            className="shadow-2 border-round"
                            height={'100px'}
                            style={{
                                width: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center'
                            }}
                            src={data.foto_kamar || `https://primefaces.org/cdn/primereact/images/galleria/galleria10.jpg`}
                            alt={data.no_kamar}
                        />
                    </div>
                    <div className="flex flex-column gap-2 mt-2">
                        <div className="card mb-0" style={{ borderRadius: '4px', padding: '4px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Meja : {data.no_kamar || '000'}</div>
                            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                                Harga :{' '}
                                <b className="text-green-700">
                                    {rupiahConverter(data.harga_kamar || 0)} / {data.per_harga}
                                </b>
                            </div>
                        </div>
                        <div className="card mb-0" style={{ borderRadius: '4px', padding: '4px' }}>
                            <span style={{ fontWeight: 'bold' }}>Fasilitas : </span>
                            <div className="mt-1">
                                {data.fasilitas?.map((item) => {
                                    return <Chip label={item.nama} style={{ borderRadius: '4px', margin: '2px' }} />;
                                })}
                            </div>
                        </div>
                        <div className="card mb-0" style={{ borderRadius: '4px', padding: '4px' }}>
                            <Button
                                severity={formik.values.kamar.some((item) => item.no_kamar === data.no_kamar) ? 'warning' : 'primary'}
                                label={formik.values.kamar.some((item) => item.no_kamar === data.no_kamar) ? 'Sudah Dipilih' : 'Pilih'}
                                className="w-full"
                                onClick={() => {
                                    const isSelected = formik.values.kamar.some((item) => item.no_kamar === data.no_kamar);
                                    const kamar = isSelected
                                        ? formik.values.kamar
                                        : [
                                            ...formik.values.kamar,
                                            {
                                                harga_kamar: data.harga_kamar,
                                                no_kamar: data.no_kamar,
                                                kode_kamar: data.kode_kamar,
                                                cek_in: '',
                                                cek_out: '',
                                                per_harga: data.per_harga
                                            }
                                        ];

                                    formik.setFieldValue('kamar', kamar);

                                    setSidebar((prev) => ({
                                        ...prev,
                                        data: data
                                    }));

                                    if (isSelected) {
                                        setSidebar((prev) => ({ ...prev, showBar: true }));
                                    }
                                }}
                            />
                        </div>
                        <div className="card mb-0" style={{ borderRadius: '4px', padding: '4px' }}>
                            <Panel header="List Waktu" toggleable>
                                <div className='grid'>
                                    <div className='col-12 flex flex-column gap-2'>
                                        <span style={{ fontWeight: 'bold' }}>Jam Tersedia : </span>
                                        <div className='flex gap-2 flex-wrap'>
                                            {data.unused?.map((item) => {
                                                return <Chip label={item} style={{ borderRadius: '4px', margin: '2px', textAlign: 'center' }} />;
                                            })}
                                        </div>
                                    </div>
                                    <div className='col-12 flex flex-column gap-2'>
                                        <span style={{ fontWeight: 'bold' }}>Terbooking : </span>
                                        <div className='flex gap-2 flex-column'>
                                            {data.used?.map((item) => {
                                                return <Chip label={item} style={{ borderRadius: '4px', margin: '2px', textAlign: 'center' }} />;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </Panel>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const headerPenginapTemplate = () => {
        return (
            <>
                <div className="flex justify-content-between">
                    <div className="p-inputgroup" style={{ width: '20%' }}>
                        <Calendar
                            dateFormat="yy-mm-dd"
                            value={dataPenginap.tglLaporan}
                            onChange={(e) => {
                                console.log(e.value);
                                setDataPenginap((prev) => ({ ...prev, tglLaporan: e.value }));
                            }}
                            selectionMode="range"
                            readOnlyInput
                        />
                        <Button icon="pi pi-search" onClick={() => getDataPenginap()} />
                    </div>
                    <InputText
                        value={dataPenginap.searchVal}
                        placeholder="Search"
                        onChange={(e) => {
                            const value = e.target.value;
                            let _filters = { ...dataPenginap.filters };

                            _filters['global'].value = value;

                            setDataPenginap((prev) => ({ ...prev, filters: _filters, searchVal: value }));
                        }}
                    />
                </div>
            </>
        );
    };

    const headerReservasiData = () => {
        return (
            <div>
                <InputText
                    value={dataReservasi.searchVal}
                    placeholder="Search"
                    onChange={(e) => {
                        const value = e.target.value;
                        let _filters = { ...dataReservasi.filters };

                        _filters['global'].value = value;

                        setDataReservasi((prev) => ({ ...prev, filters: _filters, searchVal: value }));
                    }}
                />
            </div>
        );
    };

    //

    return (
        <>
            <Toast ref={toast} />
            <div className="card" style={{ height: '100%' }}>

                <div className='flex justify-content-between align-items-center mb-4'>
                    <div className='font-bold' style={{ fontSize: "20px" }}>Transaksi</div>

                    <Button icon="pi pi-refresh" label='Muat Ulang' onClick={
                        () => getDataDash()} />
                </div>

                {dataDash.load || dataReservasi.load || dataPenginap.load ? (
                    <div className="flex flex-column gap-2">
                        <Skeleton className="w-full" height="40px" />
                        <div className="flex gap-2">
                            <Skeleton height="150px" />
                            <Skeleton height="150px" />
                            <Skeleton height="150px" />
                            <Skeleton height="150px" />
                        </div>
                    </div>
                ) : (
                    <TabView>
                        {(dataDash.filterValue ? dataDash.filteredData : dataDash.data).map((item, index) => {
                            return (
                                <TabPanel key={index} header={item.tipe_kamar}>
                                    <div
                                        style={{
                                            backgroundColor: '#F8F9FA',
                                            padding: '10px 20px',
                                            borderTop: 'solid 1px #aaaaaa',
                                            borderBottom: 'solid 1px #aaaaaa',
                                            marginBottom: '4px'
                                        }}
                                    >
                                        <div className="flex align-items-center justify-content-between font-bold">
                                            <span>Pilih Meja</span>
                                            <div className="flex gap-4 align-items-center">
                                                <Tooltip target=".custom-target-icon" />
                                                <i
                                                    className="custom-target-icon pi pi-book p-text-secondary p-overlay-badge"
                                                    data-pr-tooltip="Data Pemain"
                                                    data-pr-position="right"
                                                    data-pr-at="right+5 top"
                                                    data-pr-my="left center-2"
                                                    style={{ fontSize: '2rem', cursor: 'pointer' }}
                                                    onClick={() => {
                                                        console.log(dataPenginap);
                                                        setDataPenginap((prev) => ({ ...prev, show: true }));
                                                    }}
                                                >
                                                    <Badge value={dataPenginap.totData} severity="danger"></Badge>
                                                </i>
                                                {/* <Tooltip target=".custom-target-icon" />
                                                <i
                                                    className="custom-target-icon pi pi-calendar p-text-secondary p-overlay-badge"
                                                    data-pr-tooltip="Reservasi"
                                                    data-pr-position="right"
                                                    data-pr-at="right+5 top"
                                                    data-pr-my="left center-2"
                                                    style={{ fontSize: '2rem', cursor: 'pointer' }}
                                                    onClick={() => {
                                                        formik.setFieldValue('ppn', 0);
                                                        setSidebar((prev) => ({ ...prev, showBar: true, reservasi: true }));
                                                    }}
                                                >
                                                    {formik.values.kamar.length > 0 ? <Badge value={formik.values.kamar.length} severity="danger"></Badge> : ''}
                                                </i> */}
                                                <Tooltip target=".custom-target-icon" />
                                                <i
                                                    className="custom-target-icon pi pi-home p-text-secondary p-overlay-badge"
                                                    data-pr-tooltip="Pembayaran / Pelunasan"
                                                    data-pr-position="right"
                                                    data-pr-at="right+5 top"
                                                    data-pr-my="left center-2"
                                                    style={{ fontSize: '2rem', cursor: 'pointer' }}
                                                    onClick={() => {
                                                        if (dataReservasi.selected) {
                                                            formik.setFieldValue('ppn', dataReservasi.selected.ppn);
                                                        } else {
                                                            formik.setFieldValue('ppn', dataDash.ppn);
                                                        }
                                                        setSidebar((prev) => ({ ...prev, showBar: true, reservasi: false }));
                                                    }}
                                                >
                                                    {/* {formik.values.kamar.length > 0 ? <Badge value={formik.values.kamar.length} severity="danger"></Badge> : ''} */}
                                                    {dataReservasi.data.length > 0 ? <Badge value={dataReservasi.data.length} severity="danger"></Badge> : ''}
                                                </i>

                                                <InputText keyfilter={'alphanum'} placeholder="Cari No Meja" value={dataDash.filterValue} onChange={(e) => filterSearch(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>

                                    <DataView value={item.kamar} dataKey="no_kamar" paginator itemTemplate={itemKamarTemplate} rows={12} layout={'grid'} />
                                </TabPanel>
                            );
                        })}
                    </TabView>
                )}
            </div>

            <Sidebar
                visible={sidebar.showBar}
                onHide={() => {
                    if (sidebar.laporan) {
                        formik.resetForm();
                    }
                    setSidebar((prev) => ({ ...prev, showBar: false, reservasi: false, laporan: false }));
                    if (formik.values.kamar.length < 1) {
                        formik.resetForm();
                    }

                    formik.setErrors({});
                }}
                position="right"
                className="p-sidebar-custom"
            >
                <div>
                    <div className="flex justify-content-between">
                        <span className="text-left font-bold " style={{ fontSize: '18px' }}>
                            {sidebar.reservasi ? 'Reservasi' : sidebar.laporan ? `Data : ${formik.values.kode_invoice}` : 'Bermain Langsung'}
                        </span>
                        <span className="text-right font-bold " style={{ fontSize: '18px' }}>
                            {sidebar.laporan && `Tanggal : ${formik.values.tgl_invoice}`}
                        </span>
                    </div>
                    <div className="card" style={{ borderRadius: '4px', marginTop: '5px', padding: '10px' }}>
                        <div className="flex justify-content-between align-items-center">
                            <h4 className="mb-0">Meja</h4>
                            {!sidebar.reservasi && !sidebar.laporan ? (
                                <Button
                                    label="Gunakan Data Reservasi"
                                    onClick={() => {
                                        setDataReservasi((prev) => ({ ...prev, show: true }));
                                    }}
                                />
                            ) : (
                                ''
                            )}
                        </div>
                        <div className="flex flex-column gap-1">
                            {formik.values.kamar.map((item, index) => {
                                return (
                                    <div className="flex w-full align-items-end gap-2" key={index} style={{ borderBottom: '1px solid rgb(0,0,0)', backgroundColor: 'rgb(240, 240, 240)', marginTop: '5px', padding: '6px', borderRadius: '4px' }}>
                                        <div className="w-full flex flex-column gap-2">
                                            <div className="flex justify-content-between font-bold">
                                                <div>Meja : {item.no_kamar}</div>
                                                <div>
                                                    Harga : {rupiahConverter(item.harga_kamar)} / {item.per_harga}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 w-full">
                                                <div className="flex flex-column gap-2 w-full">
                                                    <label htmlFor={`cek_in_${index}`}>Waktu Mulai Bermain</label>
                                                    <div className="p-inputgroup">
                                                        <Calendar
                                                            id={`cek_in_${index}`}
                                                            name="cek_in"
                                                            value={item.cek_in ? new Date(item.cek_in) : null}
                                                            dateFormat="yy-mm-dd"
                                                            readOnlyInput
                                                            style={sidebar.laporan ? { pointerEvents: 'none' } : {}}
                                                            showTime={!sidebar.reservasi || sidebar.laporan || item.per_harga == 'Jam' ? true : false}
                                                            hourFormat="24"
                                                            onChange={(e) => {
                                                                const newKamar = [...formik.values.kamar];
                                                                const selectedDate = new Date(e.value);
                                                                const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')} ${String(
                                                                    selectedDate.getHours()
                                                                ).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}:${String(selectedDate.getSeconds()).padStart(2, '0')}`;

                                                                newKamar[index] = {
                                                                    ...newKamar[index],
                                                                    cek_in: formattedDate
                                                                };
                                                                formik.setFieldValue('kamar', newKamar);
                                                                const totalHarga = calculateTotalKamar(newKamar);
                                                                formik.setFieldValue('total_kamar', totalHarga);
                                                                // calculateTotalHarga(totalHarga, formik.values.disc, formik.values.ppn, formik.values.dp);
                                                            }}
                                                            className={formik.errors.kamar?.[index]?.cek_in && formik.touched.kamar?.[index]?.cek_in ? 'p-invalid' : ''}
                                                        />
                                                    </div>
                                                    {formik.errors.kamar?.[index]?.cek_in && formik.touched.kamar?.[index]?.cek_in && <small className="p-error">{formik.errors.kamar[index].cek_in}</small>}
                                                </div>
                                                <div className="flex flex-column gap-2 w-full">
                                                    <label htmlFor={`cek_out_${index}`}>Waktu Selesai Bermain</label>
                                                    <div className="p-inputgroup">
                                                        <Calendar
                                                            id={`cek_out_${index}`}
                                                            name="cek_out"
                                                            value={item.cek_out ? new Date(item.cek_out) : null}
                                                            dateFormat="yy-mm-dd"
                                                            readOnlyInput
                                                            showTime={!sidebar.reservasi || sidebar.laporan || item.per_harga == 'Jam' ? true : false}
                                                            hourFormat="24"
                                                            onChange={(e) => {
                                                                const newKamar = [...formik.values.kamar];
                                                                const selectedDate = new Date(e.value);
                                                                const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')} ${String(
                                                                    selectedDate.getHours()
                                                                ).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}:${String(selectedDate.getSeconds()).padStart(2, '0')}`;

                                                                newKamar[index] = {
                                                                    ...newKamar[index],
                                                                    cek_out: formattedDate
                                                                };

                                                                formik.setFieldValue('kamar', newKamar);
                                                                const totalHarga = calculateTotalKamar(newKamar);
                                                                formik.setFieldValue('total_kamar', totalHarga);

                                                                // calculateTotalHarga(totalHarga, formik.values.disc, formik.values.ppn, formik.values.dp);
                                                            }}
                                                            className={formik.errors.kamar?.[index]?.cek_out && formik.touched.kamar?.[index]?.cek_out ? 'p-invalid' : ''}
                                                        />
                                                    </div>
                                                    {formik.errors.kamar?.[index]?.cek_out && formik.touched.kamar?.[index]?.cek_out && <small className="p-error">{formik.errors.kamar[index].cek_out}</small>}
                                                </div>
                                            </div>
                                        </div>

                                        {!sidebar.laporan ? (
                                            <div>
                                                <Button
                                                    icon="pi pi-trash"
                                                    severity="danger"
                                                    onClick={() => {
                                                        const newKamar = formik.values.kamar.filter((_, i) => i !== index);
                                                        formik.setFieldValue('kamar', newKamar);

                                                        const totalHarga = calculateTotalKamar(newKamar);
                                                        formik.setFieldValue('total_kamar', totalHarga);

                                                        if (newKamar.length < 1) {
                                                            formik.setFieldValue('dp', 0);
                                                        }

                                                        // calculateTotalHarga(totalHarga, formik.values.disc, formik.values.ppn, formik.values.dp);
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex flex-column gap-2" style={{ width: '25%' }}>
                                                <div className="flex align-items-center">
                                                    <RadioButton
                                                        checked={formik.values.kamar[index].status == 1}
                                                        inputId={index + 'stat1'}
                                                        name={index + 'stat1'}
                                                        disabled={formik.values.kamar[index].status == 0}
                                                        value="1"
                                                        onChange={(e) => {
                                                            const newKamar = [...formik.values.kamar];

                                                            newKamar[index] = {
                                                                ...newKamar[index],
                                                                status: e.value
                                                            };

                                                            formik.setFieldValue('kamar', newKamar);
                                                        }}
                                                    />
                                                    <label htmlFor={index + 'stat1'} className="ml-2" style={{ cursor: 'pointer' }}>
                                                        Checkin
                                                    </label>
                                                </div>
                                                <div className="flex align-items-center">
                                                    <RadioButton
                                                        checked={formik.values.kamar[index].status == 0}
                                                        inputId={index + 'stat2'}
                                                        name={index + 'stat2'}
                                                        value="0"
                                                        disabled={formik.values.kamar[index].status == 0}
                                                        onChange={(e) => {
                                                            const newKamar = [...formik.values.kamar];

                                                            newKamar[index] = {
                                                                ...newKamar[index],
                                                                status: e.value
                                                            };

                                                            formik.setFieldValue('kamar', newKamar);
                                                        }}
                                                    />
                                                    <label htmlFor={index + 'stat2'} className="ml-2" style={{ cursor: 'pointer' }}>
                                                        Checkout
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="card" style={{ borderRadius: '4px', marginTop: '5px' }}>
                        <form onSubmit={formik.handleSubmit} className="flex flex-column gap-2">
                            <div className="flex gap-3">
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="nama">Nama</label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            style={{ width: '100%' }}
                                            id="nama"
                                            name="nama"
                                            readOnly={sidebar.laporan}
                                            value={formik.values.nama}
                                            onChange={(e) => {
                                                formik.setFieldValue('nama', e.target.value);
                                            }}
                                            className={isFormFieldInvalid('nama') ? 'p-invalid' : ''}
                                        />
                                    </div>
                                    {isFormFieldInvalid('nama') ? getFormErrorMessage('nama') : ''}
                                </div>

                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="nik">KTP</label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            style={{ width: '100%' }}
                                            id="nik"
                                            name="nik"
                                            readOnly={sidebar.laporan}
                                            value={formik.values.nik}
                                            onChange={(e) => {
                                                formik.setFieldValue('nik', e.target.value);
                                            }}
                                            className={isFormFieldInvalid('nik') ? 'p-invalid' : ''}
                                        />
                                    </div>
                                    {isFormFieldInvalid('nik') ? getFormErrorMessage('nik') : ''}
                                </div>
                            </div>

                            <div className="flex flex-column gap-2">
                                <label htmlFor="no_telp">No Telp</label>
                                <div className="p-inputgroup">
                                    <InputText
                                        id="no_telp"
                                        name="no_telp"
                                        readOnly={sidebar.laporan}
                                        value={formik.values.no_telp}
                                        onChange={(e) => {
                                            formik.setFieldValue('no_telp', e.target.value);
                                        }}
                                        keyfilter={'int'}
                                        className={isFormFieldInvalid('no_telp') ? 'p-invalid' : ''}
                                    />
                                </div>
                                {isFormFieldInvalid('no_telp') ? getFormErrorMessage('no_telp') : ''}
                            </div>

                            {(formik.values.status_bayar == 'Belum Lunas' && sidebar.laporan) || !sidebar.reservasi ? (
                                <div className="card mb-0" style={{ borderRadius: '4px', marginTop: '5px', backgroundColor: 'rgb(240, 240, 240)', padding: '10px' }}>
                                    <div className="flex flex-column gap-2">
                                        <div className={`flex align-items-center ${sidebar.laporan ? 'justify-content-end' : 'justify-content-between'}`}>
                                            <div style={{ width: '100%' }}>
                                                <b>DP : {rupiahConverter(formik.values.dp)}</b>
                                            </div>
                                            <div className="flex flex-column gap-1">
                                                <div className="flex gap-2 justify-content-end align-items-center">
                                                    <label htmlFor="disc">
                                                        <b>Dicount (%)</b>
                                                    </label>
                                                    <div className="p-inputgroup" style={{ width: '25%' }}>
                                                        <InputNumber
                                                            id="disc"
                                                            name="disc"
                                                            min={0}
                                                            max={100}
                                                            value={formik.values.disc}
                                                            onChange={(e) => {
                                                                if (e.value !== '') {
                                                                    formik.setFieldValue('disc', e.value);
                                                                    // calculateTotalHarga(formik.values.total_kamar, e.value, formik.values.ppn, formik.values.dp);
                                                                }
                                                            }}
                                                            className={isFormFieldInvalid('disc') ? 'p-invalid' : ''}
                                                        />
                                                    </div>
                                                    {isFormFieldInvalid('disc') ? getFormErrorMessage('disc') : ''}
                                                </div>
                                                <div className="flex gap-2 justify-content-end align-items-center">
                                                    <label htmlFor="ppn">
                                                        <b>PPN (%)</b>
                                                    </label>
                                                    <div className="p-inputgroup" style={{ width: '25%' }}>
                                                        <InputNumber
                                                            id="ppn"
                                                            name="ppn"
                                                            min={0}
                                                            max={100}
                                                            value={formik.values.ppn}
                                                            onChange={(e) => {
                                                                if (e.value !== '') {
                                                                    formik.setFieldValue('ppn', e.value);
                                                                    // calculateTotalHarga(formik.values.total_kamar, formik.values.disc, e.value, formik.values.dp);
                                                                }
                                                            }}
                                                            className={isFormFieldInvalid('ppn') ? 'p-invalid' : ''}
                                                        />
                                                    </div>
                                                    {isFormFieldInvalid('ppn') ? getFormErrorMessage('ppn') : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                ''
                            )}

                            <div className="card mb-0" style={{ borderRadius: '4px', marginTop: '5px', backgroundColor: 'rgb(240, 240, 240)', padding: '10px' }}>
                                {/* {!sidebar.reservasi && !sidebar.laporan ? (
                                    <div className="flex flex-column gap-2">
                                        <div>
                                            <b>Total Kamar : {rupiahConverter(formik.values.total_kamar)}</b>
                                        </div>
                                        <div className="flex justify-content-between">
                                            <div>
                                                <b> DP : {rupiahConverter(formik.values.dp)}</b>
                                            </div>
                                            <div>
                                                <b>Harga Total : {rupiahConverter(formik.values.total_harga)}</b>
                                            </div>
                                        </div>
                                    </div>
                                ) : ( */}
                                <div className="flex flex-column gap-2">
                                    <div className="flex justify-content-between">
                                        <div>
                                            <b>Total Meja : {rupiahConverter(formik.values.total_kamar)}</b>
                                        </div>
                                        <div className="flex gap-2 flex-column">
                                            <div>
                                                <b>Harga Total : {rupiahConverter(formik.values.total_harga)}</b>
                                            </div>
                                            {sidebar.laporan ? (
                                                <div>
                                                    <b>Sisa Bayar : {rupiahConverter(formik.values.sisa_bayar)}</b>
                                                </div>
                                            ) : (
                                                ''
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* )} */}
                            </div>

                            {formik.values.status_bayar == 'Belum Lunas' || !sidebar.reservasi || sidebar.reservasi ? (
                                <div className="card mb-0" style={{ borderRadius: '4px', marginTop: '5px', backgroundColor: 'rgb(240, 240, 240)', padding: '10px' }}>
                                    <div className="flex flex-column gap-2 mb-3">
                                        <label htmlFor="metode">Metode Pembayaran</label>
                                        <div className="p-inputgroup">
                                            <Dropdown
                                                id="metode"
                                                name="metode"
                                                placeholder="Metode Pembayaran"
                                                options={pembayaran.options}
                                                value={formik.values.metode_pembayaran}
                                                onChange={(e) => formik.setFieldValue('metode_pembayaran', e.value)}
                                                optionValue="value"
                                                optionLabel="label"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex w-full gap-2">
                                        <div className="flex flex-column gap-2 mb-3 w-full">
                                            <label htmlFor="bayar">{sidebar.reservasi ? 'DP' : 'Bayar'}</label>
                                            <div className="p-inputgroup">
                                                <InputNumber
                                                    id="bayar"
                                                    name="bayar"
                                                    mode="currency"
                                                    inputStyle={{ textAlign: 'right' }}
                                                    locale="ID-id"
                                                    currency="IDR"
                                                    value={!sidebar.reservasi ? formik.values.bayar : formik.values.dp}
                                                    onChange={(e) => {
                                                        if (sidebar.reservasi && !sidebar.laporan) {
                                                            formik.setFieldValue('dp', e.value);
                                                        } else {
                                                            formik.setFieldValue('bayar', e.value);
                                                        }
                                                    }}
                                                    keyfilter={'int'}
                                                    className={isFormFieldInvalid('bayar') ? 'p-invalid' : ''}
                                                />
                                            </div>
                                            {isFormFieldInvalid('bayar') ? getFormErrorMessage('bayar') : ''}
                                        </div>
                                        {sidebar.reservasi ? (
                                            ''
                                        ) : (
                                            <div className="flex flex-column gap-2 mb-3 w-full">
                                                <label htmlFor="kembalian">Kembalian</label>
                                                <div className="p-inputgroup">
                                                    <InputNumber
                                                        id="kembalian"
                                                        name="kembalian"
                                                        mode="currency"
                                                        inputStyle={{ textAlign: 'right' }}
                                                        locale="ID-id"
                                                        readOnly
                                                        currency="IDR"
                                                        value={formik.values.kembalian}
                                                        className={isFormFieldInvalid('kembalian') ? 'p-invalid' : ''}
                                                    />
                                                </div>
                                                {isFormFieldInvalid('kembalian') ? getFormErrorMessage('kembalian') : ''}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                ''
                            )}

                            <Button type="submit" label="Simpan" loading={sidebar.load} />
                        </form>
                        {sidebar.laporan && (
                            <Button
                                severity="warning"
                                className="mt-2 w-full"
                                label="Print"
                                loading={pdf.load}
                                onClick={() => {
                                    getDataPdf(formik.values.kode_invoice, true);
                                }}
                            />
                        )}
                    </div>
                </div>
            </Sidebar>

            <Dialog visible={dataReservasi.show} header={'Daftar Reservasi'} style={{ width: '80%' }} onHide={() => setDataReservasi((prev) => ({ ...prev, show: false }))}>
                <DataTable
                    value={dataReservasi.data}
                    paginator
                    rows={5}
                    selectionMode="single"
                    filters={dataPenginap.filters}
                    globalFilterFields={['nik', 'nama_tamu', 'kode_reservasi']}
                    header={headerReservasiData}
                    dataKey="kode_reservasi"
                    onSelectionChange={(e) => {
                        const data = e.value;

                        console.log(data);

                        formik.setValues((prev) => ({
                            ...prev,
                            nik: data.nik,
                            kamar: data.kamar?.map((item) => ({
                                ...item,
                                cek_in: item.cek_in,
                                cek_out: item.cek_out
                            })),
                            nama: data.nama_tamu,
                            dp: data.dp,
                            no_telp: data.no_telepon,
                            total_kamar: data.total_harga,
                            bayar: 0,
                            ppn: data.ppn,
                            disc: 0,
                            total_harga: 0,
                            kode_reservasi: data.kode_reservasi,
                            metode_pembayaran: data.kode_cara_bayar
                        }));

                        // calculateTotalHarga(data.total_harga, formik.values.disc, formik.values.ppn, data.dp);

                        setDataReservasi((prev) => ({ ...prev, selected: e.value, show: false }));
                    }}
                >
                    <Column field="kode_reservasi" header="Kode Reservasi"></Column>
                    <Column field="nik" header="KTP"></Column>
                    <Column field="nama_tamu" header="Nama"></Column>
                    <Column header="Detail" body={(rowData) => {
                        return <div className='flex gap-2 flex-column'>
                            {
                                rowData.kamar.map(v => {
                                    return <div style={{ fontWeight: 'bold' }}>
                                        [{v.no_kamar}] : [{v.cek_in} s.d {v.cek_out}]
                                    </div>
                                })
                            }
                        </div>
                    }}></Column>
                </DataTable>
            </Dialog>

            {/* <Dialog visible={pdf.show} style={{ width: '50vw' }} onHide={() => setPdf((prev) => ({ ...prev, show: false }))} breakpoints={{ '960px': '75vw', '641px': '100vw' }}>
                <iframe src={pdf.uri} width="100%" style={{ height: '100vh' }}></iframe>
            </Dialog> */}

            <Dialog visible={dataPenginap.show} header={"Detail Pemain"} style={{ width: '80vw' }} onHide={() => setDataPenginap((prev) => ({ ...prev, show: false }))}>
                <div className='flex gap-2 flex-column'>
                    <span style={{ fontStyle: "italic", fontWeight: 'bold' }}>
                        *Klik sekali untuk lihat detail (bagian detail untuk reprint atau untuk melakukan pembayaran ulang / pelunasan serta untuk melakukan checkout secara manual)
                    </span>
                    <DataTable
                        value={dataPenginap.data}
                        paginator
                        header={headerPenginapTemplate}
                        rows={5}
                        filters={dataPenginap.filters}
                        globalFilterFields={['nik', 'nama_tamu', 'no_telepon', 'kode_invoice', 'kamar_list']}
                        selectionMode="single"
                        dataKey="kode_invoice"
                        loading={dataPenginap.load}
                        onSelectionChange={(e) => {
                            const data = e.value;

                            console.log(data);

                            formik.setValues((prev) => ({
                                ...prev,
                                nama: data.nama_tamu,
                                no_telp: data.no_telepon,
                                kode_invoice: data.kode_invoice,
                                nik: data.nik,
                                sisa_bayar: data.sisa_bayar,
                                kamar: data.kamar,
                                total_kamar: data.total_kamar,
                                status_bayar: data.status_bayar,
                                total_harga: data.total_harga,
                                tgl_invoice: data.tgl_invoice,
                                ppn: data.ppn,
                                dp: data.dp,
                                bayar_old: data.bayar,
                                metode_pembayaran: data.kode_cara_bayar
                            }));

                            setDataPenginap((prev) => ({ ...prev, show: false }));
                            setSidebar((prev) => ({ ...prev, showBar: true, laporan: true, reservasi: false }));
                            console.log(data);
                        }}>
                        <Column field="kode_invoice" header="Kode Invoice"></Column>
                        <Column field="nik" header="KTP"></Column>
                        <Column field="kamar_list" header="Meja Dipakai"></Column>
                        <Column field="nama_tamu" header="Nama"></Column>
                        <Column field="no_telepon" header="No Telepon"></Column>
                        <Column field="bayar" header="Bayar" body={(rowData) => rupiahConverter(rowData.bayar)}></Column>
                        <Column field="total_harga" header="Total Harga" body={(rowData) => rupiahConverter(rowData.total_harga)}></Column>
                        <Column field="status_bayar" header="Status Bayar" body={(rowData) => <span className={rowData.status_bayar == '1' ? 'text-green-600' : 'text-red-600'}>{rowData.status_bayar > 0 ? 'Lunas' : 'Belum Lunas'}</span>}></Column>
                        <Column field="sisa_bayar" header="Sisa Bayar" body={(rowData) => rupiahConverter(rowData.sisa_bayar)}></Column>
                        <Column field="cara_bayar" header="Metode Pembayaran"></Column>
                    </DataTable>
                </div>
            </Dialog>
            <div style={{ display: 'none' }}>
                <PrintInvoice ref={strukRef} sidebar={sidebar} data={pdf.data} />
            </div>

            {shiftDialog && <SesiJual shiftDialog={shiftDialog} hideDialog={hideDialog} onSesiSelect={handleSesiSelect} />}
        </>
    );
}
