/**
 * Nama Program: GODONG POS - Kasir Payment
 * Pengembang: Salsabila Emma
 * Tanggal Pengembangan: 8 Jan 2024
 * Versi: 1.0.0

    Catatan:
    - Versi 1.0.0 mencakup fungsionalitas Pembayaran Kasir hingga cetak struk
    - Read
 */
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { formatDateTime, formatRibuan, getDBConfig, showError } from '../../component/GeneralFunction/GeneralFunction';
import Bank from '../component/bank';
import Member from '../component/member';
import postData from '../../lib/Axios';
import { getSessionServerSide } from '../../utilities/servertool';
import { useReactToPrint } from 'react-to-print';
import PrintReceipt from './printReceipt';
import ReceiptKitchen from './receiptKitchen';
import { useSession } from 'next-auth/react';
export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/kasir');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
};

export default function MasterPayment({ addItem, selectedSesi, paymentDialog, setPaymentDialog, totGrandTotal, dataShift, totQty, totSubTotal, totDiscount, setAddItem, isChecked, isDisabled, setIsDisabled, setReloadDataMenu }) {
    const apiEndPointStore = '/api/kasir/store';
    const apiEndPointGetCaraPesan = '/api/kasir/get_pemesanan';
    const apiEndPointGetDetail = '/api/mutasi_member/get_detailByKode';
    const toast = useRef(null);
    const [loadingBayar, setLoadingBayar] = useState(false);
    const { data: session, status } = useSession();
    const printRef = useRef();
    const strukRef = useRef();
    const strukKitchenRef = useRef();
    const [isPrinting, setIsPrinting] = useState(false);
    const [dropdownValueKategori, setDropdownValueKategori] = useState(null);
    const [dropdownPemesanan, setDropdownPemesanan] = useState({});
    const pajakRef = useRef();
    const [activeIndex, setActiveIndex] = useState(0);
    let sektor = '';
    sektor = session?.sektor;
    const emptyDataStruk = {
        KASIR: '',
        LOGOPERUSAHAAN: '',
        NAMAPERUSAHAAN: '',
        ALAMATPERUSAHAAN: '',
        TANGGAL: '',
        items: [
            {
                NAMA: '',
                HJ: '',
                DISCOUNT: '',
                PAJAK: '',
                QTY: '',
                SUBTOTAL: '',
                GRANDTOTAL: '',
                HARGADISCQTY: '',
                HARGAPPN: ''
            }
        ],
        TOTAL: ''
    };

    const emptyDataStrukDapur = {
        KASIR: '',
        LOGOPERUSAHAAN: '',
        NAMAPERUSAHAAN: '',
        ALAMATPERUSAHAAN: '',
        TANGGAL: '',
        items: [
            {
                NAMA: '',
                QTY: '',
                NOTES: ''
            }
        ]
    };

    useEffect(() => {
        async function getCaraPesan() {
            try {
                const vaTable = await postData(apiEndPointGetCaraPesan);
                const json = vaTable.data;
                setDropdownPemesanan(json.data);
            } catch (error) {
                const e = error?.response?.data || error;
                showError(toast, e?.message || 'Terjadi Kesalahan');
            }
        }

        getCaraPesan();
    }, []);

    // Gunakan state untuk menyimpan dataStruk
    const [dataStruk, setDataStruk] = useState(emptyDataStruk);
    const [dataStrukDapur, setDataStrukDapur] = useState(emptyDataStrukDapur);

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    // Fungsi untuk mencetak
    const handlePrint = useReactToPrint({
        contentRef: strukRef,
        documentTitle: 'Kasir',
        onAfterPrint: () => setIsPrinting(false)
    });

    const handlePrintKitchen = useReactToPrint({
        contentRef: strukKitchenRef,
        documentTitle: 'Kasir',
        onAfterPrint: () => setIsPrinting(false)
    });

    const [newTotGrandTotal, setNewTotGrandTotal] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Tunai');

    const apiEndPointGetAllConfig = '/api/config/get';
    const [config, setConfig] = useState(null);
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const vaTable = await postData(apiEndPointGetAllConfig);
                const json = vaTable.data;
            } catch (error) {
                const e = error?.response?.data || error;
                showError(toast, e?.message || 'Terjadi Kesalahan');
            }
        };
        const updatePayment = () => {
            const paymentValues = {
                Tunai: { CASHNOMINAL: totGrandTotal, DEBETNOMINAL: 0, EPAYMENTNOMINAL: 0 },
                Debet: { CASHNOMINAL: 0, DEBETNOMINAL: totGrandTotal, EPAYMENTNOMINAL: 0 },
                EPayment: { CASHNOMINAL: 0, DEBETNOMINAL: 0, EPAYMENTNOMINAL: totGrandTotal }
            };

            setPaymentMethod('Tunai');
            setNewTotGrandTotal(totGrandTotal);
            const newPayment = { ...paymentValues[paymentMethod] };
            setPayment(newPayment);

            let valNominalBayar = 0;
            if (newPayment.CASHNOMINAL !== 0) {
                valNominalBayar = newPayment.CASHNOMINAL;
            } else if (newPayment.DEBETNOMINAL !== 0) {
                valNominalBayar = newPayment.DEBETNOMINAL;
            } else if (newPayment.EPAYMENTNOMINAL !== 0) {
                valNominalBayar = newPayment.EPAYMENTNOMINAL;
            }
            setValNominalBayar(valNominalBayar);
        };
        updatePayment();
        setDetailMember('');
        if (paymentDialog) {
            // fetchConfig();
        }
    }, [totGrandTotal]);

    const dropdownValuesKategori = [
        { name: 'E-MONEY', code: 'E-MOMEY' },
        { name: 'OVO', code: 'OVO' },
        { name: 'GOPAY', code: 'GOPAY' },
        { name: 'DANA', code: 'DANA' },
        { name: 'LINKAJA', code: 'LINKAJA' },
        { name: 'SHOPEEPAY', code: 'SHOPEEPAY' }
    ];
    const [kembalianDialog, setKembalianDialog] = useState(false);

    const handleDropdownChange = (event) => {
        const selectedValue = event.value;

        // Perbarui state-payment dengan nilai terpilih dari Dropdown
        setPayment((prevPayment) => ({
            ...prevPayment,
            TIPEEPAYMENT: selectedValue.name
        }));

        // Perbarui nilai Dropdown
        setDropdownValueKategori(selectedValue);
    };

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };
    const [valNominalBayar, setValNominalBayar] = useState([]);
    const [valNominalCash, setValNominalCash] = useState([]);
    const [valNominalDebet, setValNominalDebet] = useState([]);
    const [valNominalEPayment, setValNominalEPayment] = useState([]);
    const [payment, setPayment] = useState([]);

    const onPaymentMethodChange = (e) => {
        const selectedMethod = e.value;
        setPaymentMethod(selectedMethod);

        let cashNominal = 0;
        let debetNominal = 0;
        let ePaymentNominal = 0;
        let updatedPayment = { ...payment };

        const resetValues = () => {
            setValNominalCash(0);
            setValNominalDebet(0);
            setValNominalEPayment(0);
            setChange(0);
            updatedPayment.TIPEEPAYMENT = null;
            updatedPayment.NAMAKARTU = null;
            updatedPayment.NOMORKARTU = null;
            updatedPayment.BIAYAKARTU = 0;
            updatedPayment.AMBILKARTU = 0;
        };

        switch (selectedMethod) {
            case 'Debet':
                debetNominal = newTotGrandTotal;
                setChange(0);
                resetValues();
                break;
            case 'QRIS':
                ePaymentNominal = newTotGrandTotal;
                setChange(0);
                resetValues();
                break;
            default:
                cashNominal = newTotGrandTotal;
                setChange(0);
                resetValues();
                break;
        }

        const totalNominalBayar = cashNominal || debetNominal || ePaymentNominal;

        setValNominalCash(cashNominal);
        setValNominalDebet(debetNominal);
        setValNominalEPayment(ePaymentNominal);
        setValNominalBayar(totalNominalBayar);

        setPayment({
            ...updatedPayment,
            CARABAYAR: selectedMethod,
            CASHNOMINAL: cashNominal,
            DEBETNOMINAL: debetNominal,
            EPAYMENTNOMINAL: ePaymentNominal
        });
    };

    const onInputChange = (e, name) => {
        const val = (e.target ? e.target.value : e.value) || '';
        let _payment = { ...payment };
        _payment[name] = val;
        setPayment(_payment);
    };

    //  ---------------------------------------------------------------------------------------< Handle Perhitungan Bayar >
    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        const updatedPayment = { ...payment, [name]: val };
        const carabayar = payment.CARABAYAR;

        //  Untuk mengubah nilai PAYMENT apabila diubah CARA BAYAR-nya
        const updatePaymentValues = (mainName, otherNames) => {
            updatedPayment[mainName] = val < 0.01 ? newTotGrandTotal : val;
            otherNames.forEach((otherName) => {
                updatedPayment[otherName] = 0;
            });
        };

        switch (carabayar) {
            case 'Tunai':
                if (name === 'CASHNOMINAL') {
                    updatePaymentValues(name, ['DEBETNOMINAL', 'EPAYMENTNOMINAL']);
                }
                break;
            case 'Debet':
                if (name === 'DEBETNOMINAL') {
                    updatePaymentValues(name, ['CASHNOMINAL', 'EPAYMENTNOMINAL']);
                }
                break;
            case 'QRIS':
                if (name === 'EPAYMENTNOMINAL') {
                    updatePaymentValues(name, ['CASHNOMINAL', 'DEBETNOMINAL']);
                }
                break;
            default:
                updatedPayment[name] = val;
        }

        setPayment(updatedPayment);
    };

    const [change, setChange] = useState(0);
    const nextFormFieldRef = useRef(null);

    // ----------------------------------------------------------------------------------------------< Handle Point Member >
    const [nominalDipakai, setNominalDipakai] = useState(0);
    const handlePointChange = (e) => {
        let value = e.value;
        if (value < 0) {
            value = 0; // Set nilai pointUsed menjadi 0 jika nilai negatif
        } else if (value > detailMember.TOTALPOINTAKHIR) {
            setPointError(`Maksimal Point yang dapat digunakan ${detailMember.TOTALPOINTAKHIR} point`);
            value = detailMember.TOTALPOINTAKHIR; // Set nilai value menjadi maksimal point
        } else {
            setPointError(null); // Clear error if valid
        }

        setPointUsed(value);
        const valNominalDipakai = value * detailMember.NOMINALPOINT;
        setNominalDipakai(valNominalDipakai);

        onInputNumberChange(value || 0, 'POINTUSED');
    };
    const [pointUsed, setPointUsed] = useState(0);
    const [valNominalPointDipakai, setValNominalPointDipakai] = useState(0);
    const [totAfterPointMember, setTotAfterPointMember] = useState(0);

    const handleKeyDownPoint = (e) => {
        if (e.key === 'Enter') {
            handlePointMember();
        }
    };

    const handlePointMember = () => {
        // if (e.key === "Enter") {
        if (pointUsed !== undefined && pointUsed !== null) {
            if (pointUsed === previousPointUsed) {
                return; // Jangan lakukan apapun jika pointUsed sama dengan nilai sebelumnya
            }
            let totalSetelahPoint = 0;
            if (pointUsed > 0) {
                const nominalPoint = initialDetailMember.NOMINALPOINT;
                const totPointDebet = initialDetailMember.TOTALPOINTAKHIR - pointUsed;
                const nominalPointDipakai = nominalPoint * pointUsed;
                const totNominalPointDebet = initialDetailMember.TOTALNOMINALAKHIR - nominalPointDipakai;
                const logArray = [
                    ['initialDetailMember', initialDetailMember],
                    ['nominalPoint', nominalPoint],
                    ['totPointDebet', totPointDebet],
                    ['nominalPointDipakai', nominalPointDipakai],
                    ['totNominalPointDebet', totNominalPointDebet]
                ];

                console.table(logArray);

                // ----< Kondisi kalo ada ALLDISCNOMINAL >
                if (totAfterAllDisc !== 0) {
                    totalSetelahPoint = totAfterAllDisc - nominalPointDipakai;
                } else {
                    totalSetelahPoint = totGrandTotal - nominalPointDipakai;
                }
                // totalSetelahPoint = totGrandTotal - nominalPointDipakai;

                setValNominalPointDipakai(nominalPointDipakai);
                setNewTotGrandTotal(totalSetelahPoint);
                setDetailMember((prevDetailMember) => ({
                    ...prevDetailMember,
                    TOTALPOINTAKHIR: totPointDebet,
                    TOTALNOMINALAKHIR: totNominalPointDebet
                }));
            } else {
                setDetailMember(initialDetailMember);
                // totalSetelahPoint = totGrandTotal;
                if (totAfterAllDisc !== 0) {
                    totalSetelahPoint = totAfterAllDisc;
                } else {
                    totalSetelahPoint = totGrandTotal;
                }
                setNewTotGrandTotal(totalSetelahPoint);
            }
            setPreviousPointUsed(pointUsed);

            if (paymentMethod === 'Tunai') {
                setPayment((prevPayment) => ({
                    ...prevPayment,
                    CASHNOMINAL: totalSetelahPoint,
                    DEBETNOMINAL: 0,
                    EPAYMENTNOMINAL: 0
                }));
            } else if (paymentMethod === 'Debet') {
                setPayment((prevPayment) => ({
                    ...prevPayment,
                    CASHNOMINAL: 0,
                    DEBETNOMINAL: totalSetelahPoint,
                    EPAYMENTNOMINAL: 0
                }));
            } else {
                setPayment((prevPayment) => ({
                    ...prevPayment,
                    CASHNOMINAL: 0,
                    DEBETNOMINAL: 0,
                    EPAYMENTNOMINAL: totalSetelahPoint
                }));
            }
            setTotAfterPointMember(totalSetelahPoint);
        }
        // }
    };

    // ----------------------------------------------------------------------------------------------< Handle AllDisc >
    const [totAfterAllDisc, setTotAfterAllDisc] = useState(0);
    const handleAllDiscChange = (e, name) => {
        let value = e.value;
        const updatedPayment = { ...payment };

        if (name === 'ALLDISC') {
            const discountNominal = (totGrandTotal * value) / 100;
            updatedPayment.ALLDISCNOMINAL = discountNominal;
            updatedPayment.ALLDISC = value;
        } else if (name === 'ALLDISCNOMINAL') {
            const discountPercent = (value / totGrandTotal) * 100;
            updatedPayment.ALLDISC = discountPercent;
            updatedPayment.ALLDISCNOMINAL = value;
        }

        // setValAllDiscNominal(updatedPayment.ALLDISCNOMINAL);
        // Set state with updated payment object
        setPayment(updatedPayment);
    };
    const handleKeyDownAllDisc = (e) => {
        if (e.key === 'Enter') {
            handleAllDisc();
        }
    };

    const handleKeyDownDonasi = (e) => {
        if (e.key === 'Enter') {
            handleDonasi();
        }
    };

    const handleBlurAllDisc = (e) => {
        handleAllDisc();
    };

    const handleAllDisc = () => {
        // if (e.key === "Enter") {
        if (payment.ALLDISCNOMINAL > totGrandTotal) {
            showToastError('Diskon Tidak Bisa Melebihi Total Penjualan!');
            return;
        }
        if (payment.ALLPPN > 0) {
            showToastError('PPN Harus 0 Terlebih Dahulu!');
            setPayment((prevPayment) => ({
                ...prevPayment,
                ALLPPN: 0
            }));
            onHideDialog();
            return;
        }

        let totalSetelahAllDisc = 0;
        if (totAfterPointMember !== 0) {
            totalSetelahAllDisc = totAfterPointMember - payment.ALLDISCNOMINAL;
        } else {
            totalSetelahAllDisc = totGrandTotal - payment.ALLDISCNOMINAL;
        }
        if (paymentMethod === 'Tunai') {
            setPayment((prevPayment) => ({
                ...prevPayment,
                CASHNOMINAL: totalSetelahAllDisc,
                DEBETNOMINAL: 0,
                EPAYMENTNOMINAL: 0
            }));
        } else if (paymentMethod === 'Debet') {
            setPayment((prevPayment) => ({
                ...prevPayment,
                CASHNOMINAL: 0,
                DEBETNOMINAL: totalSetelahAllDisc,
                EPAYMENTNOMINAL: 0
            }));
        } else {
            setPayment((prevPayment) => ({
                ...prevPayment,
                CASHNOMINAL: 0,
                DEBETNOMINAL: 0,
                EPAYMENTNOMINAL: totalSetelahAllDisc
            }));
        }
        setTotAfterAllDisc(totalSetelahAllDisc);
        setNewTotGrandTotal(totalSetelahAllDisc);
        // }
    };

    const handleDonasi = () => {
        let totalSetelahDonasi = 0;
        if (totAfterPointMember !== 0) {
            totalSetelahDonasi = totAfterPointMember - payment.ALLDISCNOMINAL + (payment.DONASI || 0);
        } else {
            totalSetelahDonasi = totGrandTotal - payment.ALLDISCNOMINAL + (payment.DONASI || 0);
        }
        // console.log(totalSetelahDonasi);

        setPayment((prevPayment) => {
            let updatedPayment = {
                ...prevPayment,
                CASHNOMINAL: 0,
                DEBETNOMINAL: 0,
                EPAYMENTNOMINAL: 0
            };

            if (paymentMethod === 'Tunai') {
                updatedPayment.CASHNOMINAL = totalSetelahDonasi;
            } else if (paymentMethod === 'Debet') {
                updatedPayment.DEBETNOMINAL = totalSetelahDonasi;
            } else {
                updatedPayment.EPAYMENTNOMINAL = totalSetelahDonasi;
            }

            return updatedPayment;
        });

        setNewTotGrandTotal(totalSetelahDonasi);
    };

    // ----------------------------------------------------------------------------------------------< Handle All PPN >
    const handleAllPpnChange = (e, name) => {
        let value = e.value;
        const updatedPayment = { ...payment };
        updatedPayment.ALLPPN = value;

        setPayment(updatedPayment);
    };
    const handleKeyDownAllPpn = (e) => {
        if (e.key === 'Enter') {
            handleAllPpn();
        }
    };

    const handleBlurAllPpn = (e) => {
        handleAllPpn();
    };
    const [lastEnteredValue, setLastEnteredValue] = useState(null);
    const [newTotGrandTotalBeforePpn, setNewTotGrandTotalBeforePpn] = useState(null);

    const handleAllPpn = (e) => {
        const inputValue = parseFloat(payment.ALLPPN);
        // Check apakah nilai input sama dengan nilai sebelumnya
        const valTotGrandTotal = totAfterAllDisc || newTotGrandTotal;
        if (inputValue !== lastEnteredValue) {
            const persPpn = (payment.ALLPPN / 100) * valTotGrandTotal;
            let totalSetelahAllPpn = 0;
            if (payment.ALLPPN > 0) {
                totalSetelahAllPpn = newTotGrandTotal + persPpn;
                setPayment((prevPayment) => ({
                    ...prevPayment,
                    ALLPPN: inputValue,
                    ALLPPNNOMINAL: persPpn
                }));
            } else if (payment.ALLPPN === 0) {
                totalSetelahAllPpn = newTotGrandTotal;
                setPayment((prevPayment) => ({
                    ...prevPayment,
                    ALLPPN: 0,
                    ALLPPNNOMINAL: 0
                }));
            }
            setNewTotGrandTotal(totalSetelahAllPpn);
            setLastEnteredValue(inputValue);
            // return;
            if (paymentMethod === 'Tunai') {
                setPayment((prevPayment) => ({
                    ...prevPayment,
                    CASHNOMINAL: totalSetelahAllPpn,
                    DEBETNOMINAL: 0,
                    EPAYMENTNOMINAL: 0
                }));
            } else if (paymentMethod === 'Debet') {
                setPayment((prevPayment) => ({
                    ...prevPayment,
                    CASHNOMINAL: 0,
                    DEBETNOMINAL: totalSetelahAllPpn,
                    EPAYMENTNOMINAL: 0
                }));
            } else {
                setPayment((prevPayment) => ({
                    ...prevPayment,
                    CASHNOMINAL: 0,
                    DEBETNOMINAL: 0,
                    EPAYMENTNOMINAL: totalSetelahAllPpn
                }));
            }
            // setNewTotGrandTotalWithPpn(totalSetelahAllPpn);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            const { CASHNOMINAL = 0, DEBETNOMINAL = 0, EPAYMENTNOMINAL = 0, BIAYAKARTU = 0, AMBILKARTU = 0, DONASI = 0 } = payment;

            // Pastikan total pembayaran sesuai dengan donasi yang telah dihitung sebelumnya
            const nominalBayar = CASHNOMINAL + DEBETNOMINAL + EPAYMENTNOMINAL;
            const totalBelanja = newTotGrandTotal; // Total belanja sudah termasuk donasi dari handleDonasi
            const totNominalBayar = totalBelanja + BIAYAKARTU;
            console.log(nominalBayar, totalBelanja, AMBILKARTU);

            const calculatedChange = nominalBayar - totalBelanja + AMBILKARTU;

            setChange(calculatedChange);

            if (calculatedChange < 0) {
                showToastError('Nominal Bayar Tidak Mencukupi!');
                return;
            }

            updateState(CASHNOMINAL, DEBETNOMINAL, EPAYMENTNOMINAL, CASHNOMINAL, calculatedChange);

            if (nextFormFieldRef.current) {
                nextFormFieldRef.current.focus();
            }
        }
    };

    // Menangani KEMBALIAN jika onBlur
    const handleBlur = () => {
        const { CASHNOMINAL = 0, DEBETNOMINAL = 0, EPAYMENTNOMINAL = 0, BIAYAKARTU = 0, AMBILKARTU = 0, DONASI = 0 } = payment;

        // Pastikan total pembayaran sesuai dengan donasi yang telah dihitung sebelumnya
        const nominalBayar = CASHNOMINAL + DEBETNOMINAL + EPAYMENTNOMINAL;
        const totalBelanja = newTotGrandTotal; // Total belanja sudah termasuk donasi dari handleDonasi
        const totNominalBayar = totalBelanja + BIAYAKARTU;
        console.log(nominalBayar, totalBelanja, AMBILKARTU);

        const calculatedChange = nominalBayar - totNominalBayar + AMBILKARTU;

        setChange(calculatedChange);

        if (calculatedChange < 0) {
            showToastError('Nominal Bayar Tidak Mencukupi!');
            return;
        }

        updateState(CASHNOMINAL, DEBETNOMINAL, EPAYMENTNOMINAL, CASHNOMINAL, calculatedChange);

        if (nextFormFieldRef.current) {
            nextFormFieldRef.current.focus();
        }
    };

    const showToastError = (message) => {
        toast.current.show({
            severity: 'error',
            summary: 'Error Message',
            detail: message,
            life: 3000
        });
    };

    const updateState = (nominalBayar, DEBETNOMINAL, EPAYMENTNOMINAL, CASHNOMINAL, calculatedChange) => {
        setValNominalBayar(nominalBayar);
        setValNominalDebet(DEBETNOMINAL);
        setValNominalEPayment(EPAYMENTNOMINAL);
        setValNominalCash(CASHNOMINAL);
        setChange(calculatedChange);
    };

    // -----------------------------------------< Btn Bayar >
    const printReceipt = () => {
        setLoadingBayar(true);
        const nominal = payment.CASHNOMINAL || payment.DEBETNOMINAL || payment.EPAYMENTNOMINAL;

        if (nominal < newTotGrandTotal || nominal === undefined) {
            toast.current.show({
                severity: 'error',
                summary: 'Error Message',
                detail: 'Nominal Kurang dari Total Belanja!',
                life: 3000
            });
            return;
        }
        // ------------------------------------------------------< Check apakah nama kartu dan nomor kartu diisi - Debet >
        if (paymentMethod === 'Debet' && (!payment.NAMAKARTU || !payment.NOMORKARTU)) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Nama dan Nomor Kartu Harus Diisi',
                life: 3000
            });
            return;
        }
        // ------------------------------------------------------< Check apakah kategori dan id pelanggan diisi - Epayment >
        if (paymentMethod === 'QRIS' && (!payment.TIPEEPAYMENT || !payment.NOMORKARTU)) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Kategori dan ID Pelanggan Harus Diisi',
                life: 3000
            });
            return;
        }

        saveTransaksi();
    };
    const [valDataTotal, setValDataTotal] = useState();
    const createDataObject = (dataShift, selectedSesi, addItem, payment) => {
        try {
            let total = 0;
            let allDiscount = 0;
            let allPpn = 0;
            let _data = {
                // FAKTUR dari sisi BE langsung
                DONASI: payment.DONASI || 0,
                KODESESI: dataShift.SESIJUAL,
                TGL: dataShift.TGL,
                GUDANG: dataShift.KODETOKO,
                DISCOUNT2: payment.ALLDISCNOMINAL,
                PAJAK2: payment.ALLPPNNOMINAL,
                CARABAYAR: activeIndex == 0 ? 'Tunai' : activeIndex == 1 ? 'Debet' : activeIndex == 2 ? 'Epayment' : 'Tunai',
                TUNAI: payment.CASHNOMINAL || 0, // Tunai
                BAYARKARTU: payment.DEBETNOMINAL || 0, // Debet
                BIAYAKARTU: payment.BIAYAKARTU || 0,
                AMBILKARTU: payment.AMBILKARTU || 0, // Tarik Tunai
                EPAYMENT: payment.EPAYMENTNOMINAL || 0,
                NAMAKARTU: payment.NAMAKARTU || null,
                NOMORKARTU: payment.NOMORKARTU,
                NAMAPEMILIK: payment.NAMAPEMILIK || null,
                TIPEEPAYMENT: payment.TIPEEPAYMENT || null,
                KEMBALIAN: change,
                MEMBER: payment.MEMBER,
                MEJA: payment.MEJA,
                PELANGGAN: payment.PELANGGAN,
                PEMESANAN: payment.PEMESANAN || 'Dine In',
                POINTKREDIT: pointUsed,
                USERNAME: dataShift.KASIR,
                detail_penjualan: addItem
                    .map((item) => {
                        let discount = item.HARGADISCQTY || 0;
                        allDiscount += discount;
                        let ppn = item.HARGAPPN || 0;
                        allPpn += ppn;
                        let jumlah = item.GRANDTOTAL; // -----< GRANDTOTAL = Harga Total setelah diskon * qty >
                        total += jumlah;
                        return {
                            DISKONPERIODE: item.DISKONPERIODE,
                            KODE: item.KODE,
                            BARCODE: item.KODE_TOKO,
                            NAMA: item.NAMA,
                            QTY: item.QTY,
                            SATUAN: item.SATUAN,
                            HARGA: item.HJ,
                            DISCOUNT: item.DISCOUNT,
                            HARGADISC: item.HARGADISCQTY,
                            PPN: ppn,
                            JUMLAH: jumlah,
                            KETERANGAN: 'PENJUALAN ' + item.NAMA
                        };
                    })
                    .filter((item) => item !== null),
                TOTAL: total,
                PAJAK: allPpn,
                DISCOUNT: allDiscount, // ----------< akumulasi dari DISCOUNT pada addItem
                kartu_stock: addItem.map((item) => {
                    return {
                        STATUS: item.STATUS || 0,
                        KODE: item.KODE,
                        // GUDANG: item.GUDANG,
                        QTY: item.QTY,
                        // DEBET: item.DEBET,
                        KREDIT: item.KREDIT || null,
                        HARGA: item.HJ
                    };
                }),
                sesi_jual: {
                    TOTALJUAL: total,
                    KARTU: payment.DEBETNOMINAL || null, // DEBET kartu
                    BIAYAKARTU: payment.BIAYAKARTU || null,
                    KREDIT: payment.AMBILKARTU || null, // Tarik tunai
                    EPAYMENT: payment.EPAYMENT || null
                }
            };
            setValDataTotal(_data.TOTAL);
            return _data;
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const saveTransaksi = async () => {
        setLoadingBayar(true);
        let _data = createDataObject(dataShift, selectedSesi, addItem, payment);
        // return console.log(_data);

        try {
            const responsePost = await postData(apiEndPointStore, _data);
            let data = responsePost.data.data;
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Transaksi Berhasil', life: 3000 });
            refreshTabel();
            setAddItem([]);
            if (isChecked) {
                const config = await getDBConfig('logo', 'nama_hotel', 'alamat_hotel', 'telp');
                // Ambil data yang sudah ada dan filter/ubah untuk sesuai format baru
                const updatedData = {
                    DONASI: payment.DONASI,
                    FAKTUR: data.Faktur,
                    ANTRIAN: data.Antrian,
                    KASIR: session?.user?.name,
                    LOGOPERUSAHAAN: config.logo,
                    NAMAPERUSAHAAN: config.nama_hotel,
                    ALAMATPERUSAHAAN: config.alamat_hotel,
                    TELP: config.telp,
                    TANGGAL: formatDateTime(new Date()),
                    CARABAYAR: activeIndex == 0 ? 'Tunai' : activeIndex == 1 ? 'Debet' : activeIndex == 2 ? 'Epayment' : 'Tunai',
                    TUNAI: _data.TUNAI || 0, // Tunai
                    BAYARKARTU: _data.BAYARKARTU || 0, // Debet
                    BIAYAKARTU: _data.BIAYAKARTU || 0,
                    AMBILKARTU: _data.AMBILKARTU || 0, // Tarik Tunai
                    EPAYMENT: _data.EPAYMENT || 0,
                    NAMAKARTU: _data.NAMAKARTU || null,
                    NOMORKARTU: _data.NOMORKARTU,
                    NAMAPEMILIK: _data.NAMAPEMILIK || null,
                    TIPEEPAYMENT: _data.TIPEEPAYMENT || null,
                    TOTAL: _data.TOTAL,
                    TOTALBERSIH: newTotGrandTotal,
                    DISCOUNT: payment.ALLDISCNOMINAL,
                    PPN: payment.ALLPPNNOMINAL,
                    KEMBALIAN: change,
                    MEJA: payment.MEJA,
                    PELANGGAN: payment.PELANGGAN,
                    PEMESANAN: payment.PEMESANAN || 'Dine In',
                    MEMBER: payment.MEMBER_NAMA,
                    POINTKREDIT: pointUsed,
                    items: addItem.map((item) => ({
                        NAMA: item.NAMA,
                        HJ: item.HJ,
                        DISCOUNT: item.DISCOUNT,
                        PAJAK: item.PAJAK,
                        QTY: item.QTY,
                        SUBTOTAL: item.SUBTOTAL,
                        GRANDTOTAL: item.GRANDTOTAL,
                        HARGADISCQTY: item.HARGADISCQTY,
                        HARGAPPN: item.HARGAPPN,
                        NOTES: item.NOTES || ''
                    }))
                };

                setDataStruk(updatedData);
                setDataStrukDapur(updatedData);
                setIsPrinting(true);
                setKembalianDialog(true);
            }

            onHideDialog();
            setLoadingBayar(false);
        } catch (error) {
            setLoadingBayar(false);
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    useEffect(() => {
        if (isPrinting) {
            handlePrint();
        }
    }, [isPrinting]);

    const onHideDialog = () => {
        setPaymentDialog(false);
        setPaymentMethod('Tunai');
        setActiveIndex(0);
        setValNominalCash(0);
        setValNominalDebet(0);
        setValNominalEPayment(0);
        setValNominalBayar(0);
        setLastEnteredValue(0);
        setReloadDataMenu(true);
        // Reset other payment-related state values as needed
        setPayment({
            CARABAYAR: 'Tunai',
            CASHNOMINAL: 0,
            DEBETNOMINAL: 0,
            EPAYMENTNOMINAL: 0,
            MEMBER: null,
            NAMAKARTU: '',
            ALLPPN: 0,
            DONASI: 0
        });
        setNewTotGrandTotal(totGrandTotal);
        setInitialDetailMember([]);
        setMemberKode('');
        setMemberNama('');
        setBankKet('');
        // setChange(0);
        setDropdownValueKategori('');
        pajakRef.current = 0;
        setDetailMember('');
        setPointUsed(0);
        setNominalDipakai(0);
        if (paymentMethod === 'Tunai') {
            setPayment((prevPayment) => ({
                ...prevPayment,
                CASHNOMINAL: totGrandTotal,
                DEBETNOMINAL: 0,
                EPAYMENTNOMINAL: 0,
                ALLPPN: 0
            }));
        } else if (paymentMethod === 'Debet') {
            setPayment((prevPayment) => ({
                ...prevPayment,
                CASHNOMINAL: 0,
                DEBETNOMINAL: totGrandTotal,
                EPAYMENTNOMINAL: 0,
                ALLPPN: 0
            }));
        } else {
            setPayment((prevPayment) => ({
                ...prevPayment,
                CASHNOMINAL: 0,
                DEBETNOMINAL: 0,
                EPAYMENTNOMINAL: totGrandTotal,
                ALLPPN: 0
            }));
        }
        setTotAfterAllDisc(0);
        setTotAfterPointMember(0);
    };
    // -----------------------------------------------------------------------------------------------------------------< Member >
    const [memberDialog, setMemberDialog] = useState(false);
    const [memberKode, setMemberKode] = useState('');
    const [memberNama, setMemberNama] = useState('');
    const btnMember = () => {
        setMemberDialog(true);
    };
    const handleMemberData = (memberKode, memberNama) => {
        setMemberKode(memberKode);
        setMemberNama(memberNama);
        setPayment((prevPayment) => ({
            ...prevPayment,
            MEMBER: memberKode,
            MEMBER_NAMA: memberNama
        }));
    };

    const [detailMember, setDetailMember] = useState('');
    const [initialDetailMember, setInitialDetailMember] = useState([]); // State untuk menyimpan nilai awal
    const [previousPointUsed, setPreviousPointUsed] = useState(null);
    const handleDetailMember = async () => {
        setPointUsed(0);
        setNominalDipakai(0);
        let requestBody = {
            KODE: payment.MEMBER || memberKode
        };
        try {
            const vaTable = await postData(apiEndPointGetDetail, requestBody);
            const json = vaTable.data.data;
            console.log(json);
            setDetailMember(json);
            setInitialDetailMember(json);
            setPreviousPointUsed(null);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };
    const batalHandleMember = async () => {
        setDetailMember(false);
        setInitialDetailMember([]);
        setPreviousPointUsed(0);
        setPointUsed(0);
        setNominalDipakai(0);
        setValNominalPointDipakai(0);
        setMemberNama('');
        if (payment.ALLDISCNOMINAL > 0) {
            const valBatalPoint = totGrandTotal - payment.ALLDISCNOMINAL;
            // setNewTotGrandTotal(valBatalPoint);
            if (payment.CASHNOMINAL > 0) {
                setPayment((prevPayment) => ({
                    ...prevPayment,
                    CASHNOMINAL: valBatalPoint,
                    DEBETNOMINAL: 0,
                    EPAYMENTNOMINAL: 0
                }));
            } else if (payment.DEBETNOMINAL > 0) {
                setPayment((prevPayment) => ({
                    ...prevPayment,
                    CASHNOMINAL: 0,
                    DEBETNOMINAL: valBatalPoint,
                    EPAYMENTNOMINAL: 0
                }));
            } else {
                setPayment((prevPayment) => ({
                    ...prevPayment,
                    CASHNOMINAL: 0,
                    DEBETNOMINAL: 0,
                    EPAYMENTNOMINAL: valBatalPoint
                }));
            }
        } else {
            // setNewTotGrandTotal(totGrandTotal);
            if (payment.CASHNOMINAL > 0) {
                setPayment((prevPayment) => ({
                    ...prevPayment,
                    CASHNOMINAL: totGrandTotal,
                    DEBETNOMINAL: 0,
                    EPAYMENTNOMINAL: 0
                }));
            } else if (payment.DEBETNOMINAL > 0) {
                setPayment((prevPayment) => ({
                    ...prevPayment,
                    CASHNOMINAL: 0,
                    DEBETNOMINAL: totGrandTotal,
                    EPAYMENTNOMINAL: 0
                }));
            } else {
                setPayment((prevPayment) => ({
                    ...prevPayment,
                    CASHNOMINAL: 0,
                    DEBETNOMINAL: 0,
                    EPAYMENTNOMINAL: totGrandTotal
                }));
            }
        }
        setPayment((prevPayment) => ({
            ...prevPayment,
            MEMBER: null
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< Bank >
    const [bankDialog, setBankDialog] = useState(false);
    const [bankKode, setBankKode] = useState('');
    const [bankKet, setBankKet] = useState('');
    const btnBank = () => {
        setBankDialog(true);
    };
    const handleBankData = (bankKode, bankKet, bankAdmin) => {
        setBankKode(bankKode);
        setBankKet(bankKet);
        setPayment((prevPayment) => ({
            ...prevPayment,
            NAMAKARTU: bankKet,
            BIAYAKARTU: bankAdmin
        }));
    };
    const handleOnHide = () => {
        setKembalianDialog(false);
        setChange(0);
    };
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleOnHide();
        }
    };

    const [pointError, setPointError] = useState(null); // State for error message

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12 lg:col-12 xl:col-12">
                <Dialog visible={paymentDialog} style={{ width: '75%' }} header="PEMBAYARAN" modal className="" onHide={onHideDialog}>
                    <div className="flex flex-column gap-2">
                        <div className="flex gap-2 align-items-center">
                            {/* <div className="field w-full">
                                <div className="p-inputgroup">
                                    <InputText readOnly value={memberNama} placeholder="Member" disabled={payment.PELANGGAN} />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnMember} disabled={payment.PELANGGAN} />
                                    {payment.MEMBER ? (
                                        <div>
                                            <Button label="Detail" className="p-button-primary p-button-md ml-2" onClick={handleDetailMember} />
                                            <Button label="Batal" className="p-button-danger p-button-md ml-2" onClick={batalHandleMember} />
                                        </div>
                                    ) : null}
                                </div>
                            </div> */}

                            <div className="field w-full">
                                <div className="p-inputgroup">
                                    <InputText readOnly value={`Rp. ${formatRibuan(newTotGrandTotal)}`} onChange={(e) => onInputChange(e, 'KODE')} style={{ fontSize: '14px', textAlign: 'right', backgroundColor: '#f5f5f5', fontWeight: 'bold' }} />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-column gap-2 w-full">
                            <div className="flex gap-2 w-full">
                                <div className="flex gap-2 flex-column w-full">
                                    <label className="font-bold">Pelanggan</label>
                                    <div className="p-inputgroup">
                                        <div className="p-inputgroup">
                                            <InputText value={payment.PELANGGAN} disabled={payment.MEMBER} placeholder="Nama Pelanggan" onChange={(e) => onInputChange(e, 'PELANGGAN')} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-column w-full">
                                    <label className="font-bold">Meja</label>
                                    <div className="p-inputgroup">
                                        <div className="p-inputgroup">
                                            <InputText value={payment.MEJA} placeholder="No Meja" onChange={(e) => onInputChange(e, 'MEJA')} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {detailMember && (
                                <div className="flex flex-column gap-2">
                                    <div className="flex flex-column gap-2">
                                        <label className="font-bold">Point</label>
                                        <div className="p-inputgroup">
                                            <InputNumber readOnly value={detailMember.TOTALPOINTAKHIR} inputStyle={{ textAlign: 'center' }} />
                                            <InputNumber readOnly value={detailMember.TOTALNOMINALAKHIR} inputStyle={{ textAlign: 'right' }} />
                                        </div>
                                    </div>
                                    <div className="flex flex-column gap-2">
                                        <label className="font-bold">Gunakan Point</label>
                                        <div className="p-inputgroup">
                                            <InputNumber autoFocus inputStyle={{ textAlign: 'right' }} onKeyDown={handleKeyDownPoint} onChange={handlePointChange} value={pointUsed} min={0} />
                                            <InputNumber readOnly value={nominalDipakai} inputStyle={{ textAlign: 'right' }} />
                                        </div>
                                        {pointError && (
                                            <p className="error-message" style={{ color: 'red', fontSize: '0.8rem' }}>
                                                {pointError}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className={`flex gap-2 w-full`}>
                                <div className="flex flex-column gap-2 justify-content-end w-full">
                                    <div className="flex gap-2 w-full">
                                        <div className="flex gap-2 flex-column w-full">
                                            <label className="font-bold">Discount Keseluruhan</label>
                                            <div className="p-inputgroup">
                                                <InputNumber
                                                    placeholder="Disc %"
                                                    value={payment.ALLDISC}
                                                    onChange={(e) => handleAllDiscChange(e, 'ALLDISC')}
                                                    onKeyDown={handleKeyDownAllDisc}
                                                    inputStyle={{ textAlign: 'right' }}
                                                    ref={nextFormFieldRef}
                                                />
                                                {/* onBlur={handleBlurAllDisc} */}
                                                <Button icon="pi pi-percentage" className="p-button" readOnly />
                                                <InputNumber
                                                    placeholder="Disc Nominal"
                                                    value={payment.ALLDISCNOMINAL}
                                                    onChange={(e) => handleAllDiscChange(e, 'ALLDISCNOMINAL')}
                                                    onKeyDown={handleKeyDownAllDisc}
                                                    inputStyle={{ textAlign: 'right' }}
                                                    ref={nextFormFieldRef}
                                                />
                                            </div>
                                        </div>
                                        {/* <div className="flex gap-2 flex-column w-full"> */}
                                        {/* <label className="font-bold">PPN Keseluruhan</label> */}
                                        {/* <div className="p-inputgroup"> */}
                                        {/* <InputNumber
                                                    disabled={isDisabled}
                                                    placeholder="PPN %"
                                                    value={payment.ALLPPN}
                                                    onChange={(e) => handleAllPpnChange(e, 'ALLPPN')}
                                                    onKeyDown={handleKeyDownAllPpn}
                                                    inputStyle={{ textAlign: 'right' }}
                                                    ref={nextFormFieldRef}
                                                /> */}
                                        {/* onBlur={handleBlurAllPpn}  */}
                                        {/* <Button icon="pi pi-percentage" className="p-button" readOnly /> */}
                                        {/* </div> */}
                                        {/* </div> */}
                                        <div className="flex gap-2 flex-column w-full">
                                            <label className="font-bold">Donasi</label>
                                            <div className="p-inputgroup">
                                                <InputNumber
                                                    autoFocus
                                                    value={payment.DONASI || 0}
                                                    onChange={(e) => onInputNumberChange(e, 'DONASI')}
                                                    // onKeyDown={handleKeyDown}
                                                    onKeyDown={handleKeyDownDonasi}
                                                    // onBlur={handleBlur}
                                                    mode="currency"
                                                    currency="IDR"
                                                    locale="id-ID"
                                                    className="w-full"
                                                    inputStyle={{ textAlign: 'right' }}
                                                    ref={nextFormFieldRef}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-column w-full">
                                            <label className="font-bold">Cara Pemesanan</label>
                                            <div className="p-inputgroup">
                                                <Dropdown value={payment.PEMESANAN || 'Dine In'} optionLabel="KETERANGAN" optionValue="KETERANGAN" options={dropdownPemesanan} onChange={(e) => onInputChange(e, 'PEMESANAN')} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full">
                            <div className="flex gap-2 w-full">
                                <TabView
                                    activeIndex={activeIndex}
                                    onTabChange={(e) => {
                                        if (e.index == 1) {
                                            setPaymentMethod('Debet');
                                            setPayment((prevPayment) => ({
                                                ...prevPayment,
                                                CASHNOMINAL: 0,
                                                DEBETNOMINAL: totGrandTotal,
                                                EPAYMENTNOMINAL: 0,
                                                ALLPPN: 0
                                            }));
                                        } else if (e.index == 2) {
                                            setPaymentMethod('Epayment');
                                            setPayment((prevPayment) => ({
                                                ...prevPayment,
                                                CASHNOMINAL: 0,
                                                DEBETNOMINAL: 0,
                                                EPAYMENTNOMINAL: totGrandTotal,
                                                ALLPPN: 0
                                            }));
                                        } else {
                                            setPaymentMethod('Tunai');
                                            setPayment((prevPayment) => ({
                                                ...prevPayment,
                                                CASHNOMINAL: totGrandTotal,
                                                DEBETNOMINAL: 0,
                                                EPAYMENTNOMINAL: 0,
                                                ALLPPN: 0
                                            }));
                                        }
                                        setActiveIndex(e.index);
                                    }}
                                    className="w-full"
                                >
                                    {/* ------------------------------------ Tab Tunai ------------------------------------ */}
                                    <TabPanel header="Bayar Tunai">
                                        <div className="flex gap-2 w-full">
                                            <div className="flex flex-column gap-2 w-full">
                                                <label className="font-bold">Cash/Tunai</label>
                                                <div className="p-inputgroup w-full">
                                                    <InputNumber
                                                        autoFocus
                                                        value={payment.CASHNOMINAL}
                                                        onChange={(e) => onInputNumberChange(e, 'CASHNOMINAL')}
                                                        // onKeyDown={handleKeyDown}
                                                        onBlur={handleBlur}
                                                        mode="currency"
                                                        currency="IDR"
                                                        locale="id-ID"
                                                        className="w-full"
                                                        inputStyle={{ textAlign: 'right' }}
                                                        ref={nextFormFieldRef}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </TabPanel>

                                    {/* ------------------------------------ Tab Debit Card ------------------------------------ */}
                                    <TabPanel header="Debit Card">
                                        <div className="flex gap-2 w-full flex-column">
                                            <div className="flex">
                                                <div className="flex gap-2 flex-column w-full">
                                                    <label className="font-bold ">Nama Kartu</label>
                                                    <div className="p-inputgroup">
                                                        <InputText readOnly value={bankKet || payment.NAMAKARTU} className="w-full" />
                                                        <Button icon="pi pi-search" onClick={btnBank} />
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 flex-column w-full">
                                                    <label className="font-bold ">Nomor Kartu</label>
                                                    <div className="p-inputgroup">
                                                        <InputText value={payment.NOMORKARTU} onChange={(e) => onInputChange(e, 'NOMORKARTU')} className="w-full" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex-column flex gap-2 w-full">
                                                    <label className="font-bold ">Nominal</label>
                                                    <div className="p-inputgroup">
                                                        <InputNumber
                                                            autoFocus
                                                            value={payment.DEBETNOMINAL}
                                                            onChange={(e) => onInputNumberChange(e, 'DEBETNOMINAL')}
                                                            mode="currency"
                                                            currency="IDR"
                                                            locale="id-ID"
                                                            className="w-full"
                                                            inputStyle={{ textAlign: 'right' }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex flex-column gap-2 w-full">
                                                    <label className="font-bold ">Ambil Tunai</label>
                                                    <div className="p-inputgroup">
                                                        <InputNumber value={payment.AMBILKARTU} onChange={(e) => onInputNumberChange(e, 'AMBILKARTU')} mode="currency" currency="IDR" locale="id-ID" className="w-full" />
                                                    </div>
                                                </div>

                                                <div className="flex flex-column gap-2 w-full">
                                                    <label className="font-bold ">Biaya Kartu</label>
                                                    <div className="p-inputgroup">
                                                        <InputNumber readOnly value={payment.BIAYAKARTU} mode="currency" currency="IDR" locale="id-ID" className="w-full" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabPanel>

                                    {/* ------------------------------------ Tab e-Money ------------------------------------ */}
                                    <TabPanel header="e-Money">
                                        <div className="flex flex-column gap-2 w-full">
                                            <div className="flex gap-2">
                                                <div className="flex flex-column w-full gap-2">
                                                    <label className="font-bold block">Kategori</label>
                                                    <div className="p-inputgroup">
                                                        <Dropdown value={dropdownValueKategori} options={dropdownValuesKategori} optionLabel="name" placeholder="Pilih Kategori" onChange={handleDropdownChange} className="w-full" />
                                                    </div>
                                                </div>

                                                <div className="flex flex-column w-full gap-2">
                                                    <label className="font-bold block">ID Pelanggan</label>
                                                    <div className="p-inputgroup">
                                                        <InputText value={payment.NOMORKARTU} onChange={(e) => onInputChange(e, 'NOMORKARTU')} className="w-full" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-column gap-2">
                                                <label className="font-bold block">Nominal</label>
                                                <div className="p-inputgroup">
                                                    <InputNumber value={payment.EPAYMENTNOMINAL} mode="currency" currency="IDR" locale="id-ID" className="w-full" onChange={(e) => onInputNumberChange(e, 'EPAYMENTNOMINAL')} />
                                                </div>
                                            </div>
                                        </div>
                                    </TabPanel>
                                </TabView>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full">
                            <div className="card w-full py-1 px-2" style={{ backgroundColor: '#f5f5f5' }}>
                                <div className="flex w-full gap-2 justify-content-center align-items-center">
                                    <div className="flex align-items-center" style={{ textWrap: 'nowrap', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                                        <strong>Kembali : </strong>
                                    </div>
                                    <div className="p-inputgroup w-full">
                                        {change >= 0 ? (
                                            <InputText
                                                type="text"
                                                value={`Rp. ${formatRibuan(change)}`}
                                                readOnly
                                                style={{ fontSize: '44px', textAlign: 'right', border: 'none', outline: 'none', boxShadow: 'none', backgroundColor: 'transparent' }}
                                                className="w-full"
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-column gap-2 w-full">
                            <div className="flex gap-2 w-full justify-content-end">
                                <div className="flex gap-2">
                                    <div className="p-inputgroup" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button label="Batal" className="p-button-secondary p-button-lg mr-2" style={{ width: '120px' }} onClick={onHideDialog} />
                                        <Button loading={loadingBayar} label="Bayar" className="p-button-primary p-button-lg" style={{ width: '120px' }} onClick={() => printReceipt()} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Dialog>

                <Member memberDialog={memberDialog} setMemberDialog={setMemberDialog} btnMember={btnMember} handleMemberData={handleMemberData} />
                <Bank bankDialog={bankDialog} setBankDialog={setBankDialog} btnBank={btnBank} handleBankData={handleBankData} />
                {/* -----------------------------------------------------------------------------------------< KARTU - BANK > */}
                <Dialog visible={kembalianDialog} modal className="p-fluid" closable={false}>
                    <div className="" style={{ fontWeight: 'bold', fontSize: '12pt' }}>
                        Kembalian :
                    </div>
                    <InputText className="w-full mt-2" autoFocus onKeyDown={handleKeyPress} readOnly value={`Rp. ${formatRibuan(change)}`} style={{ fontSize: '26px', textAlign: 'right', backgroundColor: '#f5f5f5', fontWeight: 'bold' }} />
                    <div className="mt-3">
                        <Button label="Transaksi Baru" className="p-button-primary p-button-lg w-full" onClick={handleOnHide} />
                    </div>
                    {/* <div className="mt-3">
                        <Button label="Cetak Struk Dapur" className="p-button-primary p-button-lg w-full" onClick={() => handlePrintKitchen()} />
                    </div> */}
                </Dialog>
                {/* Yang Handle Print Struk */}
                <div>
                    {/* Render komponen struk di dalam div */}
                    <div style={{ display: 'none' }}>
                        <PrintReceipt ref={strukRef} dataStruk={dataStruk} />
                    </div>
                    <div style={{ display: 'none' }}>
                        <ReceiptKitchen ref={strukKitchenRef} dataStrukDapur={dataStrukDapur} />
                    </div>
                </div>
                <div></div>
            </div>
        </div>
    );
}
