import { ArrowTopRightOnSquareIcon, PencilIcon } from "@heroicons/react/24/solid";
import { TrashIcon } from "@heroicons/react/24/outline";
import TButton from "./core/TButton.jsx";

export default function SurveyListItem({ survey, onDeleteClick }) {
    return (
        <div className= "flex flex-col rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <img
                src = {survey.image_url}
                alt = {survey.title}
                className="h-48 w-full object-cover text-gray-400"
            />
            <h4 className="text-lg font-semibold p-4 text-gray-500">{survey.title}</h4>
            <div dangerouslySetInnerHTML={{__html: survey.description}} 
                className="overflow-hidden flex-1 p-4 text-gray-600"
            ></div>
            <div className = "flex justify-between items-center mt-3 bg-gray-50">
                <TButton to = {`/surveys/${survey.id}`}>
                    <PencilIcon className="h-5 w-5 mr-2 text-gray-400" />
                    edit
                </TButton>
                <div className = "flex items-center text-sm text-gray-500 mr-4">
                    <TButton href={`/view/survey/${survey.slug}`}circle link>
                        <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-400" />
                    </TButton>

                    {survey.id &&(
                        <TButton onClick = {onDeleteClick} circle link color="red">
                            <TrashIcon className="h-5 w-5 text-gray-400" />
                        </TButton>
                    )}
                </div>
            </div>
        </div>
    )
}