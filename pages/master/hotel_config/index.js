import { DataTable } from 'primereact/datatable';
import { getSessionServerSide } from '../../../utilities/servertool';
import { Column } from 'primereact/column';
import { useFormik } from 'formik';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { ToggleButton } from 'primereact/togglebutton';
import { InputNumber } from 'primereact/inputnumber';
import { BlockUI } from 'primereact/blockui';
import postData from '../../../lib/Axios';

export async function getSessionSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

const HotelConfig = (props) => {
    //state
    const toast = useRef(null);

    const [dataConfig, setDataConfig] = useState({
        load: false,
        edit: false
    });
    //

    //function

    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const formik = useFormik({
        initialValues: {
            nama_hotel: '',
            alamat_hotel: '',
            ppn: 0,
            no_telp: '',
            logo: '',
            kota: ''
        },
        validate: (data) => {
            let errors = {};

            return errors;
        },
        onSubmit: (data) => {
            handleSave(data);
        }
    });

    const getDataConfig = async () => {
        setDataConfig((prev) => ({ ...prev, load: true }));
        try {
            const res = await postData('/api/config/get', { kode: ['nama_hotel', 'alamat_hotel', 'no_telp', 'ppn', 'logo', 'kota'] });
            console.log(res.data);

            formik.setValues({
                logo: res.data.data.logo,
                nama_hotel: res.data.data.nama_hotel,
                alamat_hotel: res.data.data.alamat_hotel,
                ppn: res.data.data.ppn,
                no_telp: res.data.data.no_telp,
                kota: res.data.data.kota
            });
            setDataConfig((prev) => ({ ...prev, load: false }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setDataConfig((prev) => ({ ...prev, load: false }));
        }
    };

    const isFormFieldInvalid = (name) => !!(formik.touched[name] && formik.errors[name]);

    const getFormErrorMessage = (name) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{formik.errors[name]}</small> : <small className="p-error">&nbsp;</small>;
    };

    useEffect(() => {
        getDataConfig();
    }, []);

    const handleSave = async (input) => {
        setDataConfig((prev) => ({ ...prev, load: true }));

        try {
            const key = Object.keys(input);
            const keterangan = Object.values(input);

            const res = await postData('/api/config/store', { kode: key, keterangan: keterangan });
            showSuccess(res.data.message || 'Berhasil Insert Data');
            setDataConfig((prev) => ({ ...prev, load: false, edit: false }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setDataConfig((prev) => ({ ...prev, load: false }));
        }
    };

    const onFileSelect = (event) => {
        const file = event.target.files[0]; // Ambil file pertama dari FileUpload
        if (file.size > 900000) {
            formik.setFieldValue('logo', null);
            return showError('File tidak boleh lebih dari 1MB.');
        }
        const reader = new FileReader();

        reader.onload = (e) => {
            formik.setFieldValue('logo', e.target.result);
        };

        if (file) {
            reader.readAsDataURL(file); // Konversi file ke base64
        }
    };
    //

    return (
        <>
            <div className="card">
                <BlockUI blocked={dataConfig.load} template={<i className="pi pi-spinpi pi-spin pi-spinner" style={{ fontSize: '28px' }}></i>}>
                    <Toast ref={toast} />
                    <div
                        style={{
                            backgroundColor: '#F8F9FA',
                            padding: '10px 20px',
                            borderTop: 'solid 1px #aaaaaa',
                            borderBottom: 'solid 1px #aaaaaa',
                            marginBottom: '10px'
                        }}
                    >
                        <div className="flex justify-content-between align-items-center">
                            <span className="font-bold text-xl">Informasi Perusahaan</span>
                            <ToggleButton onChange={(e) => setDataConfig((p) => ({ ...p, edit: e.value }))} checked={dataConfig.edit} onLabel="Edit Mode" offLabel="Info Mode" />
                        </div>
                    </div>
                    <form onSubmit={formik.handleSubmit} className="flex flex-column gap-2">
                        <div className="flex flex-column sm:flex-row gap-3">
                            <div className={dataConfig.edit ? 'p-image-preview-container' : 'p-image-container'} style={{ width: '250px', height: '250px', borderRadius: '6px' }}>
                                <img src={formik.values.logo ? formik.values.logo : '/layout/images/no_img.jpg'} alt="logo" style={{ width: '250px', height: '250px', objectFit: 'cover', objectPosition: 'center', borderRadius: '6px' }} />
                                {dataConfig.edit ? (
                                    <div className="p-image-preview-indicator" style={{ borderRadius: '6px' }} onClick={() => document.getElementById('fileInput').click()}>
                                        <i className="pi pi-pencil"></i>
                                    </div>
                                ) : (
                                    ''
                                )}
                                <input
                                    type="file"
                                    id="fileInput"
                                    accept="image/*"
                                    style={{ display: 'none' }} // Menyembunyikan input file
                                    onChange={onFileSelect}
                                />
                            </div>
                            <div className="flex flex-column w-full gap-2">
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="nama_hotel">Nama</label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            style={{ width: '100%' }}
                                            id="nama_hotel"
                                            name="nama_hotel"
                                            readOnly={!dataConfig.edit}
                                            value={formik.values.nama_hotel}
                                            onChange={(e) => {
                                                formik.setFieldValue('nama_hotel', e.target.value);
                                            }}
                                            className={isFormFieldInvalid('nama_hotel') ? 'p-invalid' : ''}
                                        />
                                    </div>
                                    {isFormFieldInvalid('nama_hotel') ? getFormErrorMessage('nama_hotel') : ''}
                                </div>
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="alamat_hotel">Alamat</label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            style={{ width: '100%' }}
                                            readOnly={!dataConfig.edit}
                                            id="alamat_hotel"
                                            name="alamat_hotel"
                                            value={formik.values.alamat_hotel}
                                            onChange={(e) => {
                                                formik.setFieldValue('alamat_hotel', e.target.value);
                                            }}
                                            className={isFormFieldInvalid('alamat_hotel') ? 'p-invalid' : ''}
                                        />
                                    </div>
                                    {isFormFieldInvalid('alamat_hotel') ? getFormErrorMessage('alamat_hotel') : ''}
                                </div>
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="kota">Kota</label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            style={{ width: '100%' }}
                                            readOnly={!dataConfig.edit}
                                            id="kota"
                                            name="kota"
                                            value={formik.values.kota}
                                            onChange={(e) => {
                                                formik.setFieldValue('kota', e.target.value);
                                            }}
                                            className={isFormFieldInvalid('kota') ? 'p-invalid' : ''}
                                        />
                                    </div>
                                    {isFormFieldInvalid('kota') ? getFormErrorMessage('kota') : ''}
                                </div>
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="no_telp">No Telepon</label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            style={{ width: '100%' }}
                                            readOnly={!dataConfig.edit}
                                            id="no_telp"
                                            name="no_telp"
                                            value={formik.values.no_telp}
                                            onChange={(e) => {
                                                formik.setFieldValue('no_telp', e.target.value);
                                            }}
                                            className={isFormFieldInvalid('no_telp') ? 'p-invalid' : ''}
                                        />
                                    </div>
                                    {isFormFieldInvalid('no_telp') ? getFormErrorMessage('no_telp') : ''}
                                </div>
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="ppn">PPN</label>
                                    <div className="p-inputgroup">
                                        <InputNumber
                                            style={{ width: '100%', textAlign: 'right' }}
                                            readOnly={!dataConfig.edit}
                                            id="ppn"
                                            name="ppn"
                                            min={0}
                                            max={100}
                                            value={formik.values.ppn == '' ? 0 : formik.values.ppn}
                                            onChange={(e) => {
                                                const ppn = e.value == '' ? 0 : e.value;

                                                formik.setFieldValue('ppn', ppn);
                                            }}
                                            className={isFormFieldInvalid('ppn') ? 'p-invalid' : ''}
                                        />
                                        <Button label="%" style={{ pointerEvents: 'none' }}></Button>
                                    </div>
                                    {isFormFieldInvalid('ppn') ? getFormErrorMessage('ppn') : ''}
                                </div>
                            </div>
                        </div>
                        {dataConfig.edit ? <Button type="submit" label="Submit" /> : ''}
                    </form>
                </BlockUI>
            </div>
        </>
    );
};

export default HotelConfig;
