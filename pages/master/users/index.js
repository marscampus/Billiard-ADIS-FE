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
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Password } from 'primereact/password';
import { FilterMatchMode } from 'primereact/api';

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

    const [dataUser, setDataUser] = useState({
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

    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const formik = useFormik({
        initialValues: {
            id: '',
            name: '',
            email: '',
            password: '',
            no_hp: '',
            status: 'nonactive',
            role: 'admin'
        },
        validate: (data) => {
            let errors = {};
            // Validasi name
            if (!data.name) {
                errors.name = 'Nama wajib diisi';
            } else if (data.name.length < 3) {
                errors.name = 'Nama harus terdiri dari minimal 3 karakter';
            } else if (!/^[a-zA-Z\s]+$/.test(data.name)) {
                errors.name = 'Nama hanya boleh berisi huruf dan spasi';
            }

            // Validasi email
            if (!data.email) {
                errors.email = 'Email wajib diisi';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                errors.email = 'Format email tidak valid';
            }

            // Validasi password
            if (!data.password && !dataUser.edit) {
                errors.password = 'Password wajib diisi';
            }

            if (data.password) {
                if (data.password.length < 8) {
                    errors.password = 'Password harus terdiri dari minimal 8 karakter';
                } else if (!/[A-Z]/.test(data.password)) {
                    errors.password = 'Password harus mengandung huruf besar';
                } else if (!/[a-z]/.test(data.password)) {
                    errors.password = 'Password harus mengandung huruf kecil';
                } else if (!/[0-9]/.test(data.password)) {
                    errors.password = 'Password harus mengandung angka';
                } else if (!/[\W_]/.test(data.password)) {
                    errors.password = 'Password harus mengandung simbol';
                }
            }

            // Validasi no_hp
            if (!data.no_hp) {
                errors.no_hp = 'Nomor HP wajib diisi';
            } else if (!/^(08|(\+62))\d{8,13}$/.test(data.no_hp)) {
                errors.no_hp = 'Nomor HP harus dimulai dengan 08 dan panjang 9-13 digit';
            }

            return errors;
        },
        onSubmit: (data) => {
            handleSave(data);
        }
    });

    const isFormFieldInvalid = (name) => !!(formik.touched[name] && formik.errors[name]);

    const getFormErrorMessage = (name) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{formik.errors[name]}</small> : <small className="p-error">&nbsp;</small>;
    };

    useEffect(() => {
        getUser();
    }, []);

    const handleSave = async (input) => {
        try {
            let endPoint;

            let body = {
                name: input.name,
                no_hp: input.no_hp,
                email: input.email,
                password: input.password,
                status: input.status,
                role: input.role
            };
            if (input.id) {
                endPoint = '/api/user/update';
                body.id = input.id;
            } else {
                endPoint = '/api/user/store';
            }

            // Kirim data ke server
            const vaData = await postData(endPoint, body);
            let res = vaData.data;
            showSuccess(res.data?.message || 'Berhasil Menyimpan Data');
            formik.resetForm();
            getUser();
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        }
    };

    const getUser = async () => {
        setDataUser((p) => ({ ...p, load: true }));

        try {
            // Kirim data ke server
            const vaData = await postData('/api/user/get', {});
            let res = vaData.data;
            console.log(res);
            setDataUser((p) => ({ ...p, data: res.data }));
            formik.resetForm();
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        } finally {
            setDataUser((p) => ({ ...p, load: false, show: false, edit: false, delete: false }));
        }
    };

    const handleDelete = async () => {
        try {
            const res = await postData('/api/user/delete', { id: formik.values.id });
            showSuccess(res.data.message);
            setDataUser((p) => ({ ...p, show: false, edit: false, delete: false }));
            getUser();
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        }
    };
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
                        setDataUser((prev) => ({ ...prev, show: true, edit: true, delete: false }));
                        console.log(rowData);

                        formik.setValues({
                            id: rowData.id,
                            name: rowData.name,
                            no_hp: rowData.no_hp,
                            status: rowData.status,
                            email: rowData.email,
                            role: rowData.role
                        });
                    }}
                />
                <Button icon="pi pi-trash" onClick={() => setDataUser((prev) => ({ ...prev, show: true, edit: false, delete: true }))} severity="danger" rounded />
            </>
        );
    };

    const footerDeleteTemplate = (
        <div>
            <Button label="No" icon="pi pi-times" onClick={() => setDataUser((prev) => ({ ...prev, show: false, edit: false, delete: false }))} className="p-button-text" />
            <Button label="Yes" icon="pi pi-check" onClick={() => handleDelete()} />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <Button label="Add" icon="pi pi-plus" onClick={() => setDataUser((p) => ({ ...p, show: true }))} />
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup"></div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        type="search"
                        onInput={(e) => {
                            const value = e.target.value;
                            let _filters = { ...dataUser.filters };

                            _filters['global'].value = value;

                            setDataUser((p) => ({ ...p, searchVal: value, filters: _filters }));
                        }}
                        placeholder="Search..."
                        value={dataUser.searchVal}
                    />
                </span>
            </div>
        </div>
    );

    useEffect(() => {
        console.log(dataUser.data);
    }, [dataUser.data]);
    //

    return (
        <>
            <Toast ref={toast}></Toast>
            <div className="card">
                <h4>User</h4>
                <DataTable value={dataUser.data} paginator rows={10} header={header} globalFilterFields={['name', 'email', 'no_hp', 'role']} filters={dataUser.filters} loading={dataUser.load} emptyMessage="Data Kosong">
                    <Column field="name" header="NAMA"></Column>
                    <Column field="email" header="EMAIL"></Column>
                    <Column field="no_hp" header="NO HP"></Column>
                    <Column field="role" header="ROLE"></Column>
                    <Column field="status" header="STATUS"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                </DataTable>
            </div>

            <Dialog
                visible={dataUser.show && !dataUser.delete}
                header={dataUser.edit ? 'Edit Data User' : 'Tambah Data User'}
                modal
                style={{ width: '70%' }}
                onHide={() => {
                    setDataUser((p) => ({ ...p, show: false, edit: false, delete: false }));
                    formik.resetForm();
                }}
            >
                <form onSubmit={formik.handleSubmit} className="flex gap-2 flex-column">
                    <div className="flex md:flex-row flex-column gap-2 w-full">
                        <div className="flex flex-column gap-2 w-full">
                            <label htmlFor="name">Nama</label>
                            <div className="p-inputgroup">
                                <InputText
                                    id="name"
                                    name="name"
                                    value={formik.values.name}
                                    onChange={(e) => {
                                        formik.setFieldValue('name', e.target.value);
                                    }}
                                    className={isFormFieldInvalid('name') ? 'p-invalid' : ''}
                                />
                            </div>
                            {isFormFieldInvalid('name') ? getFormErrorMessage('name') : ''}
                        </div>
                        <div className="flex flex-column gap-2 w-full">
                            <label htmlFor="email">Email</label>
                            <div className="p-inputgroup">
                                <InputText
                                    id="email"
                                    name="email"
                                    value={formik.values.email}
                                    onChange={(e) => {
                                        formik.setFieldValue('email', e.target.value);
                                    }}
                                    className={isFormFieldInvalid('email') ? 'p-invalid' : ''}
                                />
                            </div>
                            {isFormFieldInvalid('email') ? getFormErrorMessage('email') : ''}
                        </div>
                    </div>
                    <div className="flex flex-column gap-2 w-full">
                        <label htmlFor="password">Password</label>
                        <div className="p-inputgroup">
                            <Password
                                id="password"
                                name="password"
                                toggleMask
                                value={formik.values.password}
                                onChange={(e) => {
                                    formik.setFieldValue('password', e.target.value);
                                }}
                                className={isFormFieldInvalid('password') ? 'p-invalid' : ''}
                            />
                        </div>
                        {isFormFieldInvalid('password') ? getFormErrorMessage('password') : ''}
                    </div>
                    <div className="flex flex-column gap-2 w-full">
                        <label htmlFor="no_hp">No HP</label>
                        <div className="p-inputgroup">
                            <InputText
                                id="no_hp"
                                name="no_hp"
                                keyfilter={'int'}
                                value={formik.values.no_hp}
                                onChange={(e) => {
                                    formik.setFieldValue('no_hp', e.target.value);
                                }}
                                className={isFormFieldInvalid('no_hp') ? 'p-invalid' : ''}
                            />
                        </div>
                        {isFormFieldInvalid('no_hp') ? getFormErrorMessage('no_hp') : ''}
                    </div>
                    <div className="flex flex-column gap-2 w-full">
                        <label htmlFor="role">Role</label>
                        <div className="p-inputgroup">
                            <Dropdown
                                id="role"
                                name="role"
                                options={['admin', 'superadmin']}
                                value={formik.values.role}
                                onChange={(e) => {
                                    formik.setFieldValue('role', e.value);
                                }}
                                className={isFormFieldInvalid('role') ? 'p-invalid' : ''}
                            />
                        </div>
                        {isFormFieldInvalid('role') ? getFormErrorMessage('role') : ''}
                    </div>
                    <div className="flex flex-column gap-2 w-full">
                        <label htmlFor="status">Status</label>
                        <div className="p-inputgroup">
                            <Dropdown
                                id="status"
                                name="status"
                                options={['active', 'nonactive']}
                                value={formik.values.status}
                                onChange={(e) => {
                                    formik.setFieldValue('status', e.value);
                                }}
                                className={isFormFieldInvalid('status') ? 'p-invalid' : ''}
                            />
                        </div>
                        {isFormFieldInvalid('status') ? getFormErrorMessage('status') : ''}
                    </div>
                    <Button type="submit" label={dataUser.edit ? 'Update' : 'Save'} className="mt-2" loading={dataUser.load} />
                </form>
            </Dialog>

            <Dialog header="Delete" visible={dataUser.show && dataUser.delete} onHide={() => setDataUser((prev) => ({ ...prev, show: false, edit: false, delete: false }))} footer={footerDeleteTemplate}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>
                        are you sure you want to delete <strong>{dataUser.data?.nama}</strong>
                    </span>
                </div>
            </Dialog>
        </>
    );
};

export default HotelConfig;
