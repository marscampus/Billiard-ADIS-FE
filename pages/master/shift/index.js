import { DataTable } from 'primereact/datatable';
import { getSessionServerSide } from '../../../utilities/servertool';
import { Column } from 'primereact/column';
import { useFormik } from 'formik';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { useEffect, useState, useRef } from 'react';
import { Button } from 'primereact/button';
import postData from '../../../lib/Axios';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Password } from 'primereact/password';
import { FilterMatchMode } from 'primereact/api';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Image } from 'primereact/image';
import { showError, showSuccess } from '../../../component/GeneralFunction/GeneralFunction';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, '/master/shift');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

const Shift = (props) => {
    //state
    const toast = useRef(null);

    const [dataShift, setDataShift] = useState({
        data: [],
        load: false,
        show: false,
        edit: false,
        delete: false,

        searchVal: '',
        filters: { global: { value: null, matchMode: FilterMatchMode.CONTAINS } }
    });
    //

    //function

    const formik = useFormik({
        initialValues: {
            KODE: '',
            KETERANGAN: ''
        },
        validate: (data) => {
            let errors = {};

            if (!data.KODE) {
                errors.KODE = 'Kode Wajib Diisi';
            }

            return errors;
        },
        onSubmit: (data) => {
            handleSave(data);
        }
    });

    const handleSave = async (input) => {
        try {
            let endPoint;

            let body = input;
            if (dataShift.edit) {
                endPoint = '/api/shift/update';
            } else {
                endPoint = '/api/shift/store';
            }

            console.log(endPoint);

            // Kirim data ke server
            const vaData = await postData(endPoint, body);
            let res = vaData.data;
            showSuccess(toast, res.message || 'Berhasil Menyimpan Data');
            formik.resetForm();
            getShift();
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const getShift = async () => {
        setDataShift((p) => ({ ...p, load: true }));

        try {
            // Kirim data ke server
            const vaData = await postData('/api/shift/get', {});
            let res = vaData.data;
            console.log(res);
            setDataShift((p) => ({ ...p, data: res.data }));
            formik.resetForm();
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setDataShift((p) => ({ ...p, load: false, show: false, edit: false, delete: false }));
        }
    };

    const handleDelete = async () => {
        try {
            const res = await postData('/api/shift/delete', { KODE: formik.values.KODE });
            showSuccess(res.data.message);
            setDataShift((p) => ({ ...p, show: false, edit: false, delete: false }));
            getShift();
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const rupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(number);
    };
    const isFormFieldInvalid = (name) => !!(formik.touched[name] && formik.errors[name]);

    const getFormErrorMessage = (name) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{formik.errors[name]}</small> : <small className="p-error">&nbsp;</small>;
    };

    useEffect(() => {
        getShift();
    }, []);

    useEffect(() => {
        console.log(dataShift.data);
    }, [dataShift.data]);
    //

    //template
    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button
                    icon="pi pi-pencil"
                    severity="success"
                    rounded
                    className="mr-2"
                    onClick={() => {
                        setDataShift((prev) => ({ ...prev, show: true, edit: true, delete: false }));
                        console.log(rowData);

                        formik.setValues({
                            KODE: rowData.KODE,
                            KETERANGAN: rowData.KETERANGAN
                        });
                    }}
                />
                <Button
                    icon="pi pi-trash"
                    onClick={() => {
                        setDataShift((prev) => ({ ...prev, show: true, edit: false, delete: true }));

                        formik.setValues((p) => ({
                            ...p,
                            KODE: rowData.KODE,
                            KETERANGAN: rowData.KETERANGAN
                        }));
                    }}
                    severity="danger"
                    rounded
                />
            </>
        );
    };

    const footerDeleteTemplate = (
        <div>
            <Button label="No" icon="pi pi-times" onClick={() => setDataShift((prev) => ({ ...prev, show: false, edit: false, delete: false }))} className="p-button-text" />
            <Button label="Yes" icon="pi pi-check" onClick={() => handleDelete()} />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <Button label="Add" icon="pi pi-plus" onClick={() => setDataShift((p) => ({ ...p, show: true }))} />
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup"></div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        type="search"
                        onInput={(e) => {
                            const value = e.target.value;
                            let _filters = { ...dataShift.filters };

                            _filters['global'].value = value;

                            setDataShift((p) => ({ ...p, searchVal: value, filters: _filters }));
                        }}
                        placeholder="Search..."
                        value={dataShift.searchVal}
                    />
                </span>
            </div>
        </div>
    );
    //

    return (
        <>
            <Toast ref={toast}></Toast>
            <div className="card">
                <h4>Shift</h4>
                <DataTable value={dataShift.data} paginator rows={10} header={header} globalFilterFields={['KODE', 'KETERANGAN']} filters={dataShift.filters} loading={dataShift.load} emptyMessage="Data Kosong">
                    <Column field="KODE" header="KODE"></Column>
                    <Column field="KETERANGAN" header="KETERANGAN"></Column>

                    <Column headerStyle={{ textAlign: 'center' }} header="Action" body={actionBodyTemplate}></Column>
                </DataTable>
            </div>

            <Dialog
                visible={dataShift.show && !dataShift.delete}
                header={dataShift.edit ? 'Edit Data Shift' : 'Tambah Data Shift'}
                modal
                style={{ width: '40%' }}
                onHide={() => {
                    setDataShift((p) => ({ ...p, show: false, edit: false, delete: false }));
                    formik.resetForm();
                }}
            >
                <form onSubmit={formik.handleSubmit} className="flex gap-2 flex-column">
                    <div className="flex flex-column gap-3">
                        <div className="flex flex-column gap-2 w-full">
                            <label htmlFor="KODE">KODE</label>
                            <div className="p-inputgroup">
                                <InputText
                                    id="KODE"
                                    name="KODE"
                                    keyfilter={'int'}
                                    readOnly={dataShift.edit}
                                    value={formik.values.KODE}
                                    onChange={(e) => {
                                        formik.setFieldValue('KODE', e.target.value);
                                    }}
                                    className={isFormFieldInvalid('KODE') ? 'p-invalid' : ''}
                                />
                            </div>
                            {isFormFieldInvalid('KODE') ? getFormErrorMessage('KODE') : ''}
                        </div>

                        <div className="flex flex-column gap-2 w-full">
                            <label htmlFor="KETERANGAN">KETERANGAN</label>
                            <div className="p-inputgroup">
                                <InputText
                                    id="KETERANGAN"
                                    name="KETERANGAN"
                                    value={formik.values.KETERANGAN}
                                    onChange={(e) => {
                                        formik.setFieldValue('KETERANGAN', e.target.value);
                                    }}
                                    className={isFormFieldInvalid('KETERANGAN') ? 'p-invalid' : ''}
                                />
                            </div>
                            {isFormFieldInvalid('KETERANGAN') ? getFormErrorMessage('KETERANGAN') : ''}
                        </div>
                    </div>
                    <Button type="submit" label={dataShift.edit ? 'Update' : 'Save'} className="mt-2" loading={dataShift.load} />
                </form>
            </Dialog>

            <Dialog header="Delete" visible={dataShift.show && dataShift.delete} onHide={() => setDataShift((prev) => ({ ...prev, show: false, edit: false, delete: false }))} footer={footerDeleteTemplate}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>
                        are you sure you want to delete <strong>{formik.values.KODE}</strong>
                    </span>
                </div>
            </Dialog>
        </>
    );
};

export default Shift;
