import { useRouter } from 'next/router';
import React from 'react';
import AppConfig from '../../../layout/AppConfig';
import { Button } from 'primereact/button';
import { Fieldset } from 'primereact/fieldset';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { useState } from 'react';
import { RadioButton } from 'primereact/radiobutton';

const ErrorPage = () => {
    const router = useRouter();
    const categories = [{name: 'Accounting', key: 'A'}, {name: 'Marketing', key: 'M'}, {name: 'Production', key: 'P'}, {name: 'Research', key: 'R'}];
    const [selectedCategory, setSelectedCategory] = useState(categories[1]);
    const [city, setCity] = useState(null);

    return (
        <div className='"h-full'>
            <div className="grid">
                <div className="col-12 flex align-items-center justify-content-center">
                    <div className="p-fluid" style={{margin:'40px'}}>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-6" style={{padding:'30px'}}>
                                <div>
                                    <h4 style={{ color: '#8183f4', fontFamily: 'Arial, sans-serif', fontSize: '18px', fontWeight: 'bold' }}>Welcome to Andromeda!</h4>
                                    <h4 style={{ fontFamily: 'Arial, sans-serif', fontSize: '32px', fontWeight: 'bold' }}>Select your Magic Plan!</h4>
                                </div>
                                <Accordion activeIndex={0}>
                                    <AccordionTab header="Header I">
                                        <p>
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                                            commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim
                                            id est laborum.
                                        </p>
                                    </AccordionTab>
                                    <AccordionTab header="Header II">
                                        <p>
                                            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                                            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Consectetur, adipisci velit, sed quia non numquam eius modi.
                                        </p>
                                    </AccordionTab>
                                    <AccordionTab header="Header III">
                                        <p>
                                            At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt
                                            in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo
                                            minus.
                                        </p>
                                    </AccordionTab>
                                </Accordion>
                            </div>
                            <div className="card field col-12 mb-2 lg:col-6" style={{padding:'30px'}}>
                                <div className="card">
                                    <div className="field-radiobutton">
                                        <RadioButton inputId="city1" name="city" value="Chicago" onChange={(e) => setCity(e.value)} checked={city === 'Chicago'} />
                                        <label style={{ fontWeight: 'bold', fontSize: '20px'}} htmlFor="city2">Chicago</label>
                                    </div>
                                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin lobortis imperdiet lacinia. Duis nisi leo, auctor a felis eget, gravida porta ipsum. Suspendisse potenti.</p>
                                </div>
                                <div className="card">
                                    <div className="field-radiobutton">
                                        <RadioButton inputId="city2" name="city" value="Los Angeles" onChange={(e) => setCity(e.value)} checked={city === 'Los Angeles'} />
                                        <label style={{ fontWeight: 'bold', fontSize: '20px'}} htmlFor="city2">Los Angeles</label>
                                    </div>
                                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin lobortis imperdiet lacinia. Duis nisi leo, auctor a felis eget, gravida porta ipsum. Suspendisse potenti.</p>
                                </div>
                                <div className="card">
                                    <div className="field-radiobutton">
                                        <RadioButton inputId="city2" name="city" value="Los Angeles" onChange={(e) => setCity(e.value)} checked={city === 'Los Angeles'} />
                                        <label style={{ fontWeight: 'bold', fontSize: '20px'}} htmlFor="city2">Ciki</label>
                                    </div>
                                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin lobortis imperdiet lacinia. Duis nisi leo, auctor a felis eget, gravida porta ipsum. Suspendisse potenti.</p>
                                </div>
                                <Button label="Continue" style={{width:'100%'}}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

ErrorPage.getLayout = function getLayout(page) {
    return (
        <React.Fragment>
            {page}
        </React.Fragment>
    );
};

export default ErrorPage;
