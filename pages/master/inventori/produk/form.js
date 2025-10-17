/**
     * Nama Program: GODONG POS - Master - Inventori Produk Form
     * Pengembang: Salsabila Emma
     * Tanggal Pengembangan: 4 April 2024
     * Versi: 1.1.0

    Catatan:
    - Versi 1.1.0 mencakup fungsionalitas Menu Inventori Produk Form
*/
import { useRouter } from 'next/router';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { TabPanel, TabView } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import { getYMD, showError } from '../../../../component/GeneralFunction/GeneralFunction';
// import CameraCapture from '../../../../component/captureCamera';
import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import Golongan from '../../../component/golongan';
import Gudang from '../../../component/gudang';
import Produk from '../../../component/produk';
import Satuan from '../../../component/satuan';
import Supplier from '../../../component/supplier';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, '/master/inventori/produk');
    if (sessionData?.redirect) {
        return sessionData;
    }
    // const { id } = context.params;
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
}
const WIDTH = 500;
export default function addProduk() {
    const apiEndPointGetKode = '/api/produk/get_kode';
    const apiEndPointStore = '/api/produk/store';
    const apiEndPointUpdate = '/api/produk/update';
    const apiEndPointGetDataEdit = '/api/produk/getdata_edit';

    const router = useRouter();
    const toast = useRef(null);
    // const [produk, setProduk] = useState([]);
    const [produk, setProduk] = useState({
        PAJAK: false, // Default value untuk PAJAK adalah false
        BKP: '0', // Default value untuk BKP adalah "0"
        JENIS: 'B'
    });
    const [variant, setVariant] = useState([]);
    const [variantInputs, setVariantInputs] = useState({
        TIPE_VARIANT: '',
        VARIANT: '',
        BARCODE_VARIANT: '',
        HARGA_BELI_VARIANT: 0,
        HARGA_JUAL_VARIANT: 0
    });
    const [kadaluarsa, setKadaluarsa] = useState(false);
    const [satuan, setSatuan] = useState(null);
    const [stokAwal, setStokAwal] = useState(false);
    const [kode, setKode] = useState(null);

    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const [detail, setDetail] = useState(null);
    const [harga, setHarga] = useState(null);
    const [hargaPromo, setHargaPromo] = useState(null);
    const [checkboxValue, setCheckboxValue] = useState([]);
    const [radioValue, setRadioValue] = useState(null);
    const [isChecked, setIsChecked] = useState(false);
    const [hargaBeliList, setHargaBeliList] = useState([{ id: 1, value: '', keterangan: '' }]);
    const [hargaJualList, setHargaJualList] = useState([{ id: 1, value: '', satuan: '' }]);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    useEffect(() => {
        const { status } = router.query;
        const KODE = localStorage.getItem('KODE');
        if (status === 'update') {
            setKode(KODE);
            fetchDataForEdit();
            setReadOnlyEdit(true);
            setIsUpdateMode(true); // Set state isUpdateMode to true
            setIsImageUploaded(true);
        } else {
            loadLazyData();
            setIsUpdateMode(false); // Set state isUpdateMode to false
        }
    }, []);
    // router.query

    const op = useRef(null);

    const fetchDataForEdit = async () => {
        const KODE = localStorage.getItem('KODE');
        setLoading(true);
        try {
            let requestBody = { Kode: KODE };
            const vaTable = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaTable.data.data;
            if (json.STATUS_STOCK === '1') {
                setStokAwal(true);
            }
            setProduk(json);
            setGolonganKet(json.KETGOLONGAN);
            // setRakKet(json.KETRAK);
            setGudangKet(json.KETGUDANG);
            setSupplierNama(json.NAMASUPPLIER);
            setVariant(json.VARIANT);
            console.log(json.VARIANT);

            const initialSatuanList = [
                { id: 1, value: json.SATUAN || '', keterangan: json.KETSATUAN1 || '' },
                ...(json.SATUAN2 || json.KETSATUAN2 ? [{ id: 2, value: json.SATUAN2, keterangan: json.KETSATUAN2 }] : []),
                ...(json.SATUAN3 || json.KETSATUAN3 ? [{ id: 3, value: json.SATUAN3, keterangan: json.KETSATUAN3 }] : [])
            ];
            setSatuanList(initialSatuanList);

            const initialHargaBeliList = [];
            if (json.HB > 0) initialHargaBeliList.push({ id: 1, value: json.HB, satuan: '' });
            if (json.HB2 > 0) initialHargaBeliList.push({ id: 2, value: json.HB2, satuan: '' });
            if (json.HB3 > 0) initialHargaBeliList.push({ id: 3, value: json.HB3, satuan: '' });
            setHargaBeliList(initialHargaBeliList);

            const initialHargaJualList = [];
            if (json.HJ > 0) initialHargaJualList.push({ id: 1, value: json.HJ, satuan: '' });
            if (json.HJ2 > 0) initialHargaJualList.push({ id: 2, value: json.HJ2, satuan: '' });
            if (json.HJ3 > 0) initialHargaJualList.push({ id: 3, value: json.HJ3, satuan: '' });
            setHargaJualList(initialHargaJualList);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDataTable = async (event) => {
        // op.current.toggle(event);
        let indeks = null;
        let skipRequest = false;
        switch (event.index) {
            case 1:
                indeks = 2;
                detail !== null ? (skipRequest = true) : '';
                break;
            case 2:
                indeks = 3;
                satuan !== null ? (skipRequest = true) : '';
                break;
            case 3:
                indeks = 4;
                harga !== null ? (skipRequest = true) : '';
                break;
            case 4:
                indeks = 5;
                hargaPromo !== null ? (skipRequest = true) : '';
                break;
            default:
                indeks = 1;
                detail !== null ? (skipRequest = true) : '';
                break;
        }

        setActiveIndex(event.index ?? 0);
        setLoadingItem(true);
        // if(skipRequest === false){
        //     const resProduk = await dataTableProduk(indeks);
        //     updateStateProduk(indeks,resProduk);
        // }
        setLoadingItem(false);
    };
    const onPage = (event) => {
        setlazyState(event);
    };

    // ------------------------------------------------------------------< Multiple input Satuan >
    // -----------------------------------------------------------------------------------------------------------------< Satuan >
    const [satuanDialog, setSatuanDialog] = useState(false);
    const [satuanKode, setSatuanKode] = useState('');
    const [satuanKeterangan, setSatuanKeterangan] = useState('');
    const [satuanKeterangan2, setSatuanKeterangan2] = useState('');
    const [satuanKeterangan3, setSatuanKeterangan3] = useState('');
    const [activeSatuanIndex, setActiveSatuanIndex] = useState(0);
    const btnSatuan = (index) => {
        setActiveSatuanIndex(index);
        setSatuanDialog(true);
    };

    const handleSatuanData = (satuanKode, satuanKeterangan) => {
        const updatedSatuanList = [...satuanList];
        updatedSatuanList[activeSatuanIndex].keterangan = satuanKeterangan;
        setSatuanList(updatedSatuanList);
    };

    const [satuanList, setSatuanList] = useState([{ id: 1, value: '', keterangan: '' }]);
    const handleInputChange = (index, field, value) => {
        const list = [...satuanList];
        list[index][field] = value;
        setSatuanList(list);

        const updatedProduk = { ...produk };
        if (index === 0) {
            updatedProduk.Satuan = list[0].value;
            updatedProduk.KetSatuan1 = list[0].keterangan;
        } else if (index === 1) {
            updatedProduk.Satuan2 = list[1].value;
            updatedProduk.KetSatuan2 = list[1].keterangan;
        } else if (index === 2) {
            updatedProduk.Satuan3 = list[2].value;
            updatedProduk.KetSatuan3 = list[2].keterangan;
        }
        setProduk(updatedProduk);
    };

    const handleAddInput = () => {
        if (satuanList.length < 3) {
            const newList = [...satuanList];
            newList.push({ id: newList.length + 1, value: '', keterangan: '' });
            setSatuanList(newList);
        }
    };

    const handleRemoveInput = (index) => {
        const list = [...satuanList];
        list.splice(index, 1);
        setSatuanList(list);

        const updatedProduk = { ...produk };
        if (index === 0) {
            updatedProduk.Satuan = list[0] ? list[0].value : '';
            updatedProduk.KetSatuan1 = list[0] ? list[0].keterangan : '';
        } else if (index === 1) {
            updatedProduk.Satuan2 = list[1] ? list[1].value : '';
            updatedProduk.KetSatuan2 = list[1] ? list[1].keterangan : '';
        } else if (index === 2) {
            updatedProduk.Satuan3 = list[2] ? list[2].value : '';
            updatedProduk.KetSatuan3 = list[2] ? list[2].keterangan : '';
        }
        setProduk(updatedProduk);
    };

    // ----------------------------------------------------------------------------< Harga Beli >--
    const handleInputChangeHB = (index, field, value) => {
        const newList = hargaBeliList.map((item, idx) => {
            if (idx === index) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setHargaBeliList(newList);

        // Update produk berdasarkan nilai HB, HB2, HB3 dari hargaBeliList
        const updatedProduk = { ...produk };
        if (index === 0) {
            updatedProduk.HB = value;
        } else if (index === 1) {
            updatedProduk.HB2 = value;
        } else if (index === 2) {
            updatedProduk.HB3 = value;
        }
        setProduk(updatedProduk);
    };

    const handleAddInputHB = () => {
        if (hargaBeliList.length < 3) {
            const newList = [...hargaBeliList, { id: hargaBeliList.length + 1, value: '', satuan: '' }];
            setHargaBeliList(newList);
        }
    };

    const handleRemoveInputHB = (index) => {
        const newList = [...hargaBeliList];
        newList.splice(index, 1);
        setHargaBeliList(newList);
    };

    // -------------------------------------------------------------------------------< Harga Jual >--
    const handleInputChangeHJ = (index, field, value) => {
        const newList = hargaJualList.map((item, idx) => {
            if (idx === index) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setHargaJualList(newList);

        // Update produk berdasarkan nilai HJ, HJ2, HJ3 dari hargaJualList
        const updatedProduk = { ...produk };
        if (index === 0) {
            updatedProduk.HJ = value;
        } else if (index === 1) {
            updatedProduk.HJ2 = value;
        } else if (index === 2) {
            updatedProduk.HJ3 = value;
        }
        setProduk(updatedProduk);
    };

    const handleAddInputHJ = () => {
        if (hargaJualList.length < 3) {
            const newList = [...hargaJualList, { id: hargaJualList.length + 1, value: '', satuan: '' }];
            setHargaJualList(newList);
        }
    };

    const handleRemoveInputHJ = (index) => {
        const newList = [...hargaJualList];
        newList.splice(index, 1);
        setHargaJualList(newList);
    };

    // ----------------------------------------------------------------------------------------------< Harga Tingkat >--
    const [tingkatHargaList, setTingkatHargaList] = useState([{ id: 1, harga: '', qtyMin: '' }]);
    const handleAddInputTingkatHarga = () => {
        if (tingkatHargaList.length < 6) {
            // Maksimal 6 tingkat harga
            const newList = [...tingkatHargaList];
            newList.push({ id: newList.length + 1, harga: '', qtyMin: '' });
            setTingkatHargaList(newList);
        }
    };

    // ------------------------------------------------------------
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _produk = { ...produk };
        _produk[`${name}`] = val;
        setProduk(_produk);
    };
    const onInputChangeBkp = (e, name) => {
        const checked = e.checked;
        setProduk((prevState) => ({
            ...prevState,
            [name]: checked, // Update nilai PAJAK
            BKP: checked ? '1' : '0' // Update nilai BKP berdasarkan nilai PAJAK
        }));
    };

    const onInputNumberChange = (e, field) => {
        const val = e.value || 0;
        setProduk({
            ...produk,
            [field]: val
        });
    };

    const onJenisChange = (e) => {
        setProduk({
            ...produk,
            JENIS: e.value
        });
    };

    const onKemasanChange = (e) => {
        let _produk = { ...produk };
        _produk['DOS'] = e.value;
        setProduk(_produk);
    };
    const onDateChange = (e) => {
        const selectedDate = e.value; // Mendapatkan nilai tanggal yang dipilih
        setProduk((prevProduk) => ({
            ...prevProduk,
            EXPIRED: selectedDate // Memperbarui nilai produk.EXPIRED dengan tanggal yang dipilih
        }));
    };

    const onCheckboxChange = (e) => {
        let selectedValue = [...checkboxValue];
        if (e.checked) {
            selectedValue.push(e.value);
            setIsChecked(true); // set ke true jika dicentang
        } else {
            selectedValue.splice(selectedValue.indexOf(e.value), 1);
            setIsChecked(false); // set ke false jika tidak dicentang
            setKadaluarsa({
                ...produk,
                EXPIRED: null
            });
        }
        setCheckboxValue(selectedValue);
    };

    const onInputChangeCheck = (e, field) => {
        const val = (e.target && e.target.value) || '';
        let _produk = { ...produk };
        _produk[`${name}`] = val;
        setProduk(_produk);
    };

    const handleCheckboxChange = (e) => {
        setStokAwal(e.checked);
        if (!e.checked) {
            // If checkbox is unchecked, set StockAwal to 0
            onInputChangeCheck({ target: { value: 0 } }, 'STOCKAWAL');
        }
    };

    // -----------------------------------------------------------------------------------------------------------------< Golongan >
    const [golonganDialog, setGolonganDialog] = useState(false);
    const [golonganKode, setGolonganKode] = useState('');
    const [golonganKet, setGolonganKet] = useState('');
    const btnGolongan = () => {
        setGolonganDialog(true);
    };
    const handleGolonganData = (golonganKode, golonganKet) => {
        setGolonganKode(golonganKode);
        setGolonganKet(golonganKet);
        setProduk((prevProduk) => ({
            ...prevProduk,
            GOLONGAN: golonganKode
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< Rak >
    const [rakDialog, setRakDialog] = useState(false);
    const [rakKode, setRakKode] = useState('');
    const [rakKet, setRakKet] = useState('');
    const btnRak = () => {
        setRakDialog(true);
    };
    const handleRakData = (rakKode, rakKet) => {
        setRakKode(rakKode);
        setRakKet(rakKet);
        setProduk((prevProduk) => ({
            ...prevProduk,
            RAK: rakKode
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< Gudang >
    const [gudangDialog, setGudangDialog] = useState(false);
    const [gudangKode, setGudangKode] = useState('');
    const [gudangKet, setGudangKet] = useState('');
    const btnGudang = () => {
        setGudangDialog(true);
    };
    const handleGudangData = (gudangKode, gudangKet) => {
        setGudangKode(gudangKode);
        setGudangKet(gudangKet);
        setProduk((prevProduk) => ({
            ...prevProduk,
            GUDANG: gudangKode
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< Supplier >
    const [supplierDialog, setSupplierDialog] = useState(false);
    const [supplierKode, setSupplierKode] = useState('');
    const [supplierNama, setSupplierNama] = useState('');
    const btnSupplier = () => {
        setSupplierDialog(true);
    };
    const handleSupplierData = (supplierKode, supplierNama) => {
        setSupplierKode(supplierKode);
        setSupplierNama(supplierNama);
        setProduk((prevProduk) => ({
            ...prevProduk,
            SUPPLIER: supplierKode
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< Image >
    const [selectedImageOption, setSelectedImageOption] = useState('upload'); // Initial value is "upload"
    const [newImageUrl, setNewImageUrl] = useState(null);
    const [imageUrls, setImageUrls] = useState([]);
    const [isImageUploaded, setIsImageUploaded] = useState(false); // Tambahkan state untuk menandai apakah gambar sudah diunggah
    const [uploadedImageUrl, setUploadedImageUrl] = useState(null); // Tambahkan state untuk menyimpan URL gambar yang sudah diunggah

    const onImageChange = (event) => {
        setSelectedImageOption({
            ...selectedImageOption,
            image: event.target.value
        });
    };
    // ---------------------------------------------------------------- Drop Gambar
    const handleInputChangeImage = (event) => {
        const imageFile = event.target.files[0];

        const reader = new FileReader();

        reader.addEventListener('load', () => {
            const imageUrl = reader.result;

            const image = new Image();
            image.src = imageUrl;

            image.onload = (e) => {
                const canvas = document.createElement('canvas');
                const ratio = WIDTH / e.target.width;
                canvas.width = WIDTH;
                canvas.height = e.target.height * ratio;

                const context = canvas.getContext('2d');
                context.drawImage(image, 0, 0, canvas.width, canvas.height);

                const newImageUrl = context.canvas.toDataURL('image/jpeg', 90);

                setImageUrls((prevImageUrls) => [...prevImageUrls, newImageUrl]);
                const base64Data = newImageUrl.split(',')[1]; // Ambil bagian data URL gambar tanpa prefix
                setUploadedImageUrl(base64Data); // Simpan URL gambar yang sudah diunggah tanpa prefix
                setIsImageUploaded(true);
                setProduk((prevProduk) => ({
                    ...prevProduk,
                    FOTO: base64Data // Simpan hanya data base64 tanpa prefix
                }));
            };
        });

        reader.readAsDataURL(imageFile);
    };

    const handleButtonClick = () => {
        document.getElementById('fileInput').click();
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const imageFile = event.dataTransfer.files[0];

        const reader = new FileReader();

        reader.addEventListener('load', () => {
            const imageUrl = reader.result;

            const image = new Image();
            image.src = imageUrl;

            image.onload = (e) => {
                const canvas = document.createElement('canvas');
                const ratio = WIDTH / e.target.width;
                canvas.width = WIDTH;
                canvas.height = e.target.height * ratio;

                const context = canvas.getContext('2d');
                context.drawImage(image, 0, 0, canvas.width, canvas.height);

                const newImageUrl = context.canvas.toDataURL('image/jpeg', 90);

                setImageUrls((prevImageUrls) => [...prevImageUrls, newImageUrl]);
                const base64Data = newImageUrl.split(',')[1]; // Ambil bagian data URL gambar tanpa prefix
                setUploadedImageUrl(base64Data); // Simpan URL gambar yang sudah diunggah tanpa prefix
                setIsImageUploaded(true);
                setProduk((prevProduk) => ({
                    ...prevProduk,
                    FOTO: base64Data // Simpan hanya data base64 tanpa prefix
                }));
            };
        });

        reader.readAsDataURL(imageFile);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    // ----------------------------------------------------------------
    const webcamRef = useRef(null);
    const [image, setImage] = useState('');

    // -----------------------------------------------------------------------------------------------------------------< PRODUK / BARCODE >
    const [produkDialog, setProdukDialog] = useState(false);
    const [produkKode, setProdukKode] = useState('');
    const [produkNama, setProdukNama] = useState('');
    const btnProduk = () => {
        setProdukDialog(true);
    };
    const handleProdukData2 = (produkKode, produkNama) => {
        setProdukKode(produkKode);
        setProdukNama(produkNama);
        // onRowSelectBarcode({data: {KODETOKO: produkFaktur}});
        setProduk((prevProduk) => ({
            ...prevProduk,
            NAMA: produkNama
        }));
    };

    const loadLazyData = async () => {
        // setLoading(true);
        try {
            let requestBody = {
                KODE: 'STK',
                LEN: 10
            };
            const vaTable = await postData(apiEndPointGetKode, requestBody);
            const json = vaTable.data;
            setKode(json.data);
            setProduk((prevProduk) => ({
                ...prevProduk,
                KODE: json.data
            }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const convertUndefinedToNull = (obj) => {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    convertUndefinedToNull(obj[key]); // Memanggil fungsi rekursif jika nilai properti adalah objek
                } else if (obj[key] === undefined) {
                    obj[key] = null; // Mengubah nilai undefined menjadi null
                }
            }
        }
    };

    const createDataObject = (_produk) => {
        const data = {
            KODE: isUpdateMode ? kode : _produk.KODE,
            KODETOKO: _produk.KODETOKO,
            NAMA: _produk.NAMA,
            BKP: _produk.BKP,
            JENIS: _produk.JENIS,
            GOLONGAN: _produk.GOLONGAN,
            // RAK: _produk.RAK,
            GUDANG: _produk.GUDANG,
            SUPPLIER: _produk.SUPPLIER || supplierKode,
            EXPIRED: getYMD(_produk.EXPIRED || new Date()),
            BERAT: _produk.BERAT,
            DOS: _produk.DOS,
            SATUAN: _produk.SATUAN,
            SATUAN2: _produk.SATUAN2 || '',
            SATUAN3: _produk.SATUAN3 || '',
            ISI: _produk.ISI,
            ISI2: _produk.ISI2 || 0,
            DISCOUNT: _produk.DISCOUNT,
            MIN: _produk.MIN,
            MAX: _produk.MAX,
            STOCKAWAL: stokAwal ? 'Unlimited' : _produk.STOCKAWAL || 0,
            HB: _produk.HB || 0,
            HB2: _produk.HB2 || 0,
            HB3: _produk.HB3 || 0,
            HJ: _produk.HJ,
            HJ2: _produk.HJ2 || 0,
            HJ3: _produk.HJ3 || 0,
            FOTO: _produk.FOTO,
            VARIANT: variant
        };

        convertUndefinedToNull(data);
        return data;
    };

    const saveProduk = async (e) => {
        e.preventDefault();
        let _produk = { ...produk };
        let _data = createDataObject(_produk);
        const fields = {
            KODETOKO: 'Barcode Masih Kosong',
            NAMA: 'Nama Masih Kosong',
            JENIS: 'Jenis Masih Kosong',
            GOLONGAN: 'Golongan Masih Kosong',
            SATUAN: 'Satuan Masih Kosong',
            HJ: 'HJ Masih Kosong'
        };

        for (const [key, message] of Object.entries(fields)) {
            if (!_data[key]) {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: message, life: 3000 });
                return;
            }
        }

        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaTable = await postData(endPoint, _data);
            let data = vaTable.data;
            toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Tersimpan', life: 3000 });
            router.push('/master/inventori/produk');
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.error('Error while loading data:', error);
        }
    };
    // ------------------------------------------------------------------------------------------------------ button
    const produkFooter = (
        <>
            <Button
                label="Import Excel"
                icon="pi pi-file-import"
                className="p-button-text"
                onClick={() => {
                    router.push('/konversi/stock');
                }}
            />
            <Button
                label="Cancel"
                icon="pi pi-times"
                className="p-button-text"
                onClick={() => {
                    router.push('/master/inventori/produk');
                }}
            />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveProduk} />
        </>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>{isUpdateMode ? 'Edit' : 'Add'} Produk</h4>
                    <hr />
                    <Toast ref={toast} />
                    <TabView activeIndex={activeIndex} onTabChange={toggleDataTable}>
                        <TabPanel header="Detail Item">
                            <div>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="kode">Kode</label>
                                        <div className="p-inputgroup">
                                            {/* <InputText readOnly id="kode" value={kode} onChange={(e) => onInputChange(e, 'KODE')}  /> */}
                                            <InputText readOnly value={isUpdateMode ? produk.KODE : kode} />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="barcode">Barcode</label>
                                        <div className="p-inputgroup">
                                            <InputText id="barcode" value={produk.KODETOKO} onChange={(e) => onInputChange(e, 'KODETOKO')} required />
                                        </div>
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="namaproduk">Nama Produk</label>
                                        <div className="p-inputgroup">
                                            <InputText id="namaProduk" value={produk.NAMA || produkNama} onChange={(e) => onInputChange(e, 'NAMA')} required />
                                            <Button icon="pi pi-search" className="p-button" onClick={btnProduk} />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label className="mb-3">Jenis</label>
                                        <div className="p-inputgroup">
                                            <div className="field-radiobutton col-6">
                                                <RadioButton inputId="jenis_barang" name="Jenis" value="B" onChange={onJenisChange} checked={produk.JENIS === 'B'} />
                                                <label htmlFor="jenis_barang">Barang</label>
                                            </div>
                                            {/* <div className="field-radiobutton col-6">
                                                <RadioButton inputId="jenis_jasa" name="Jenis" value="J" onChange={onJenisChange} checked={produk.JENIS === 'J'} />
                                                <label htmlFor="jenis_jasa">Jasa</label>
                                            </div> */}
                                        </div>
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-12">
                                        <label htmlFor="golongan">Golongan</label>
                                        <div className="p-inputgroup">
                                            <InputText readOnly value={golonganKode || produk.GOLONGAN} />
                                            <Button icon="pi pi-search" className="p-button" onClick={btnGolongan} required />
                                            {/* disabled={readOnlyEdit} */}
                                            <InputText readOnly value={golonganKet} />
                                        </div>
                                    </div>
                                    {/* <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="rak">Rak</label>
                                        <div className="p-inputgroup">
                                            <InputText readOnly value={rakKode || produk.RAK} />
                                            <Button icon="pi pi-search" className="p-button" onClick={btnRak} />
                                            <InputText readOnly value={rakKet} />
                                        </div>
                                    </div> */}
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="gudang">Gudang</label>
                                        <div className="p-inputgroup">
                                            <InputText readOnly value={gudangKode || produk.GUDANG} />
                                            <Button icon="pi pi-search" className="p-button" onClick={btnGudang} />
                                            {/* disabled={readOnlyEdit} */}
                                            <InputText readOnly value={gudangKet} />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="supplier">Supplier</label>
                                        <div className="p-inputgroup">
                                            <InputText readOnly value={produk.SUPPLIER || supplierKode} />
                                            <Button icon="pi pi-search" className="p-button" onClick={btnSupplier} />
                                            <InputText readOnly value={supplierNama} />
                                        </div>
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="kadaluarsa">Tanggal Kadaluarsa</label>
                                        <div className="formgrid grid">
                                            <div className="field col-8 mb-2 lg:col-8">
                                                {/* {!produk.TIDAKEXPIRED && ( */}
                                                <div className="p-inputgroup">
                                                    <Calendar id="kadaluarsa" value={produk.EXPIRED} onChange={onDateChange} showIcon disabled={!isChecked} dateFormat="dd-mm-yy" />
                                                </div>
                                                {/* )} */}
                                            </div>
                                            <div className="field col-4 mb-2 lg:col-4">
                                                <div className="p-field-checkbox">
                                                    <div className="p-inputgroup mt-2">
                                                        <Checkbox inputId="kadaluarsa" name="kadaluarsa" value="Kadaluarsa" checked={checkboxValue.indexOf('Kadaluarsa') !== -1} onChange={onCheckboxChange} />
                                                        <label className="ml-2"> Ada</label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="berat">Berat</label>
                                        <div className="p-inputgroup">
                                            <InputNumber id="berat" mode="decimal" value={produk.BERAT} onChange={(e) => onInputNumberChange(e, 'BERAT')} inputStyle={{ textAlign: 'right' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                        {/* <TabPanel header="Variant">
                            <div>
                                <DataTable value={variant} header={variantHeaderTemplate} tableStyle={{ minWidth: '50rem' }}>
                                    <Column field="VARIANT" header="Variant" body={VarBodyTemplate} />
                                    <Column field="BARCODE_VARIANT" header="Barcode" body={barcodeVarBodyTemplate} />
                                    <Column field="HARGA_BELI_VARIANT" header="Harga Beli" body={hrgBeliVarBodyTemplate} />
                                    <Column field="HARGA_JUAL_VARIANT" header="Harga Jual" body={hrgJualVarBodyTemplate} />
                                    <Column header="Action" body={actionVarBodyTemplate}></Column>
                                </DataTable>
                            </div>
                        </TabPanel> */}
                        <TabPanel header="Satuan">
                            <div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <label htmlFor="kemasan">Kemasan</label>
                                        <div className="p-inputgroup">
                                            <div className="field-radiobutton col-4">
                                                <RadioButton inputId="kemasan1" name="kemasan" value="1" onChange={onKemasanChange} checked={produk.DOS === '1'} />
                                                <label htmlFor="kemasan1">1 Kemasan</label>
                                            </div>
                                            <div className="field-radiobutton col-4">
                                                <RadioButton inputId="kemasan2" name="kemasan" value="2" onChange={onKemasanChange} checked={produk.DOS === '2'} />
                                                <label htmlFor="kemasan2">2 Kemasan</label>
                                            </div>
                                            <div className="field-radiobutton col-4">
                                                <RadioButton inputId="kemasan3" name="kemasan" value="3" onChange={onKemasanChange} checked={produk.DOS === '3'} />
                                                <label htmlFor="kemasan3">3 Kemasan</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <div className="p-field-checkbox">
                                            <label>Stok Awal</label>
                                            <div className="p-inputgroup mt-2">
                                                <Checkbox inputId="stok-awal" name="stokAwal" value="StokAwal" checked={stokAwal} onChange={handleCheckboxChange} />
                                                {stokAwal ? (
                                                    <div className="field col-10 mb-2 lg:col-10">
                                                        <div className="p-inputgroup">
                                                            <InputText id="stok-unlimited" value="Unlimited" readOnly inputStyle={{ textAlign: 'right' }} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="field col-10 mb-2 lg:col-10">
                                                        <div className="p-inputgroup">
                                                            <InputNumber
                                                                id="stok-awal"
                                                                value={produk.STOCKAWAL || 0} // Default to 0 if no value is provided
                                                                onChange={(e) => onInputNumberChange(e, 'STOCKAWAL')}
                                                                inputStyle={{ textAlign: 'right' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    {satuanList.map((satuan, index) => (
                                        <div key={index} className="formgrid grid">
                                            <div className="field col-12 mb-2 lg:col-12">
                                                <label htmlFor={`satuan${index + 1}`}>Satuan {index + 1}</label>
                                                <div className="p-inputgroup">
                                                    <InputText id={`satuan${index + 1}`} value={satuan.value} onChange={(e) => handleInputChange(index, 'value', e.target.value)} />
                                                    <Button icon="pi pi-search" className="p-button" onClick={() => btnSatuan(index)} />
                                                    <InputText readOnly id={`ket-satuan${index + 1}`} value={satuan.keterangan} />
                                                    {satuanList.length > 1 && <Button icon="pi pi-times" className="p-button-danger p-button-rounded p-button-text" onClick={() => handleRemoveInput(index)} />}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {satuanList.length < 3 && <Button icon="pi pi-plus" label="Tambah Satuan" className="p-button p-button-text" onClick={handleAddInput} />}
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel header="Harga">
                            <div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <div className="formgrid grid">
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="isi1">Isi 1</label>
                                                <div className="p-inputgroup">
                                                    <InputNumber id="isi1" value={produk.ISI} onChange={(e) => onInputNumberChange(e, 'ISI')} inputStyle={{ textAlign: 'right' }} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="isi2">Isi 2</label>
                                                <div className="p-inputgroup">
                                                    <InputNumber id="isi2" value={produk.ISI2} onChange={(e) => onInputNumberChange(e, 'ISI2')} inputStyle={{ textAlign: 'right' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <div className="formgrid grid">
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="min-stock">Minimal Stok</label>
                                                <div className="p-inputgroup">
                                                    <InputNumber
                                                        id="min-stock"
                                                        value={produk.MIN}
                                                        onChange={(e) => onInputNumberChange(e, 'MIN')}
                                                        className={classNames({ 'p-invalid': submitted && !produk.MIN })}
                                                        inputStyle={{ textAlign: 'right' }}
                                                    />
                                                    <span className="p-inputgroup-addon">{satuanList.length > 0 ? satuanList[0].value : '-'}</span>
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="max-stok">Maximal Stok</label>
                                                <div className="p-inputgroup">
                                                    <InputNumber id="max-stok" value={produk.MAX} onChange={(e) => onInputNumberChange(e, 'MAX')} className={classNames({ 'p-invalid': submitted && !produk.MAX })} inputStyle={{ textAlign: 'right' }} />
                                                    <span className="p-inputgroup-addon">{satuanList.length > 0 ? satuanList[0].value : '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="diskon">Diskon</label>
                                        <div className="p-inputgroup">
                                            <InputNumber id="diskon" value={produk.DISCOUNT} onChange={(e) => onInputNumberChange(e, 'DISCOUNT')} inputStyle={{ textAlign: 'right' }} />
                                            <Button icon="pi pi-percentage" className="p-button" readOnly />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="isi2">Pajak</label>
                                        <div className="p-inputgroup">
                                            <Checkbox id="BKP" checked={produk.BKP === '1'} onChange={(e) => onInputChangeBkp(e, 'BKP')} />
                                            <span className="ml-2">Barang Kena Pajak</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-6">
                                        {hargaBeliList.map((hargaBeli, index) => (
                                            <div className="formgrid grid" key={index}>
                                                <div className="field col-12 mb-2 lg:col-12">
                                                    <label htmlFor={`harga-beli${index + 1}`}>Harga Beli {index + 1}</label>
                                                    <div className="p-inputgroup">
                                                        <InputNumber id={`harga-beli${index + 1}`} value={hargaBeli.value} onChange={(e) => handleInputChangeHB(index, 'value', e.value)} inputStyle={{ textAlign: 'right' }} />
                                                        <span className="p-inputgroup-addon">{satuanList[index] ? satuanList[index].value : '-'}</span>
                                                        {hargaBeliList.length > 1 && <Button icon="pi pi-times" className="p-button-danger p-button-text" onClick={() => handleRemoveInputHB(index)} />}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {hargaBeliList.length < 3 && <Button icon="pi pi-plus" label="Tambah HB" className="p-button p-button-text" onClick={handleAddInputHB} />}
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        {hargaJualList.map((hargaJual, index) => (
                                            <div key={index} className="formgrid grid">
                                                <div key={index} className="field col-12 mb-2 lg:col-12">
                                                    <label htmlFor={`harga-jual${index + 1}`}>Harga Jual {index + 1}</label>
                                                    <div className="p-inputgroup">
                                                        <InputNumber id={`harga-jual${index + 1}`} value={hargaJual.value} onChange={(e) => handleInputChangeHJ(index, 'value', e.value)} inputStyle={{ textAlign: 'right' }} />
                                                        <span className="p-inputgroup-addon">{satuanList[index] ? satuanList[index].value : '-'}</span>
                                                        {hargaJualList.length > 1 && <Button icon="pi pi-times" className="p-button-danger p-button-text" onClick={() => handleRemoveInputHJ(index)} />}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {hargaJualList.length < 3 && <Button icon="pi pi-plus" label="Tambah HJ" className="p-button p-button-text" onClick={handleAddInputHJ} />}
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                        {/* <TabPanel header="Harga Promo">
                        <div>
                            <div class="grid formgrid">
                                <div className="field col-12 mb-2 lg:col-2">
                                </div>
                                <div className="field col-12 mb-2 lg:col-6">
                                    <label htmlFor="harga-jual">Harga Jual</label>
                                </div>
                                <div className="field col-12 mb-2 lg:col-4">
                                    <label htmlFor="qtyMin">QTY Min</label>
                                </div>
                            </div>
                            {tingkatHargaList.map((tingkatHarga, index) => (
                                <div key={index}>
                                    <div className="grid formgrid">
                                        <div className="field col-2 mb-2 lg:col-2">
                                            <p className="p-inputgroup-addon">Tingkat {index + 1}</p>
                                        </div>
                                        <div className="field col-6 mb-2 lg:col-6">
                                            <div className="p-inputgroup">
                                                <InputNumber
                                                    id={`harga-tingkat${index + 1}`}
                                                    // value={tingkatHarga.harga}
                                                    value={isUpdateMode ? (
                                                        index === 0 ? produk.HJ_TINGKAT1 :
                                                        index === 1 ? produk.HJ_TINGKAT2 :
                                                        index === 2 ? produk.HJ_TINGKAT3 :
                                                        index === 3 ? produk.HJ_TINGKAT4 :
                                                        index === 4 ? produk.HJ_TINGKAT5 :
                                                        index === 5 ? produk.HJ_TINGKAT6 :
                                                        produk.HJ_TINGKAT7
                                                    ) : tingkatHarga.harga }
                                                    onChange={(e) => handleInputChangeTingkatHarga(index, 'harga', e.value)}
                                                    // mode="currency"
                                                    // currency="IDR"
                                                    // locale="id-ID"
                                                    inputStyle={{ textAlign:'right' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="field col-4 mb-2 lg:col-4">
                                            <div className="p-inputgroup">
                                                <InputText
                                                    id={`qty-min${index + 1}`}
                                                    // value={tingkatHarga.qtyMin}
                                                    value={isUpdateMode ? (
                                                        index === 0 ? produk.MIN_TINGKAT1 :
                                                        index === 1 ? produk.MIN_TINGKAT2 :
                                                        index === 2 ? produk.MIN_TINGKAT3 :
                                                        index === 3 ? produk.MIN_TINGKAT4 :
                                                        index === 4 ? produk.MIN_TINGKAT5 :
                                                        index === 5 ? produk.MIN_TINGKAT6 :
                                                        produk.MIN_TINGKAT7
                                                    ) : tingkatHarga.qtyMin }
                                                    onChange={(e) => handleInputChangeTingkatHarga(index, 'qtyMin', e.target.value)}
                                                />
                                                {tingkatHargaList.length > 1 && (
                                                    <Button icon="pi pi-times" className="p-button-danger p-button-text" onClick={() => handleRemoveInputTingkatHarga(index)} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {tingkatHargaList.length < 6 && (
                                <Button icon="pi pi-plus" className="p-button-secondary p-button-text" onClick={handleAddInputTingkatHarga} />
                            )}
                        </div>
                        </TabPanel> */}
                        <TabPanel header="Upload Image">
                            <div>
                                <div className="grid formgrid">
                                    <div className="field-radiobutton col-12 mb-2 lg:col-12">
                                        <RadioButton inputId="upload_gambar" name="image" value="upload" onChange={onImageChange} checked={selectedImageOption.image === 'upload'} />
                                        <label htmlFor="">Upload Gambar :</label>
                                    </div>
                                    <div className="col-12 mb-2 lg:col-12" style={{ paddingBottom: '20px' }}>
                                        {selectedImageOption.image === 'upload' && (
                                            <>
                                                <div
                                                    id="dropArea"
                                                    onDrop={handleDrop}
                                                    onDragOver={handleDragOver}
                                                    style={{
                                                        width: '100%',
                                                        height: '200px',
                                                        border: '3px dashed #ccc',
                                                        textAlign: 'center',
                                                        paddingTop: '80px',
                                                        marginTop: '10px',
                                                        marginBottom: '20px',
                                                        borderRadius: '20px'
                                                    }}
                                                >
                                                    <input id="fileInput" type="file" style={{ display: 'none' }} accept=".jpg, .jpeg, .png" onChange={handleInputChangeImage} />
                                                    <Button label="Pilih atau Drop File Gambar Disini" icon="pi pi-upload" style={{ marginLeft: '20px', marginRight: '10px', borderRadius: '20px' }} onClick={handleButtonClick} />
                                                </div>
                                                <div>Preview Gambar :</div>
                                            </>
                                        )}
                                        {isImageUploaded && (
                                            <div className="field-wrapper col-100 mb-100 lg:col-100" id={`wrapper-preview`}>
                                                <img src={`data:image/jpeg;base64,${isUpdateMode ? produk.FOTO : uploadedImageUrl}`} alt={`Gambar preview`} width={200} />
                                            </div>
                                        )}
                                        {isUpdateMode && !isImageUploaded && produk.FOTO && (
                                            <div className="field-wrapper col-100 mb-100 lg:col-100" id={`wrapper-preview`}>
                                                <img src={`data:image/jpeg;base64,${produk.FOTO}`} alt={`Gambar preview`} width={200} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* <div className="grid formgrid">
                                    <div className="field-radiobutton col-12 mb-2 lg:col-12">
                                        <RadioButton inputId="capture_gambar" name="image" value="capture" onChange={onImageChange} checked={selectedImageOption.image === 'capture'} />
                                        <label htmlFor="">Ambil Gambar :</label>
                                    </div>
                                    <div style={{ paddingTop: '20px' }}>
                                        {selectedImageOption.image === 'capture' && (
                                            <div>
                                                <label htmlFor="">Ambil Gambar :</label>
                                                <CameraCapture />
                                            </div>
                                        )}
                                    </div>
                                </div> */}
                            </div>
                        </TabPanel>
                    </TabView>
                    <Toolbar className="mb-4" right={produkFooter}></Toolbar>
                    {/* <Rak rakDialog={rakDialog} setRakDialog={setRakDialog} btnRak={btnRak} handleRakData={handleRakData} /> */}
                    <Gudang gudangDialog={gudangDialog} setGudangDialog={setGudangDialog} btnGudang={btnGudang} handleGudangData={handleGudangData} />
                    <Supplier supplierDialog={supplierDialog} setSupplierDialog={setSupplierDialog} btnSupplier={btnSupplier} handleSupplierData={handleSupplierData} />
                    <Satuan
                        setProduk={setProduk}
                        produk={produk}
                        activeSatuanIndex={activeSatuanIndex}
                        setActiveSatuanIndex={setActiveSatuanIndex}
                        satuanList={satuanList}
                        setSatuanList={setSatuanList}
                        satuanDialog={satuanDialog}
                        setSatuanDialog={setSatuanDialog}
                        btnSatuan={btnSatuan}
                        handleSatuanData={handleSatuanData}
                    />
                    <Golongan golonganDialog={golonganDialog} setGolonganDialog={setGolonganDialog} btnGolongan={btnGolongan} handleGolonganData={handleGolonganData} />
                </div>
            </div>
            <Produk produkDialog={produkDialog} setProdukDialog={setProdukDialog} btnProduk={btnProduk} handleProdukData2={handleProdukData2} />
        </div>
    );
}
// export default AddPage;
