import React from "react"
import PageComponent from "../components/PageComponent.jsx";
import { useStateContext } from "../Contexts/ContextProvider.jsx";
import SurveyListItem from "../components/SurveyListItem.jsx";
import TButton from "../components/core/TButton.jsx";
import { PlusCircleIcon } from "@heroicons/react/24/solid";

export default function Surveys() {
    const {surveys} = useStateContext();
    console.log(surveys);
    const onDeleteClick = () => {
        console.log("Eliminar encuesta");
    }
    return (
        <PageComponent title="Encuestas" buttons ={
            (
            <TButton color="green" to="/surveys/create">
                <PlusCircleIcon className="h-6 w-6 mr-2 text-gray-50" />
                Crear Encuesta
            </TButton>
        )}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
                {surveys.map( (survey => (
                    <SurveyListItem survey={survey} key={survey.id} onDeleteClick={onDeleteClick} />
                )))}
            </div>
        </PageComponent>
    )
}