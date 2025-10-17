import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Skeleton } from 'primereact/skeleton';

const TabelSkaleton = (props)=>{
    const bodyTemplateSkeleton = () =>{
        return <Skeleton></Skeleton>
    }

    return (
            // <DataTable value={props.items}>
            //     {props.columns.map((col,i)=>{
            //         <Column headerStyle={{ textAlign: "center" }} key={col.field} header={col.header} body={bodyTemplateSkeleton}></Column>
            //     })}
            // </DataTable>

            <DataTable value={props.items}>
                {props.kolom.map((col, i) => (
                    <Column headerStyle={{ textAlign: "center" }} key={col.field} header={col.header} body={bodyTemplateSkeleton} />
                ))}
            </DataTable>

    );

}

export default TabelSkaleton;
