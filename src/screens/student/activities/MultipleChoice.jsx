import React, { useState, useEffect } from 'react';

const MultipleChoiceActivity = ({ activity, submitting, submitAnswer, contentItem }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answered, setAnswered] = useState(false);
    const [shuffledOptions, setShuffledOptions] = useState([]);

    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    useEffect(() => {
        setCurrentQuestionIndex(0);
        setAnswered(false);
    }, [activity, contentItem]);

    const getContent = () => {
        if (contentItem && contentItem.data) {
            return contentItem.data;
        }
        return activity.content || {};
    };

    const extractQuestions = (content) => {
        let questions = [];
        if (Array.isArray(content)) {
            questions = content;
        } else if (content.questions && Array.isArray(content.questions)) {
            questions = content.questions;
        } else if (typeof content === 'object') {
            questions = [content];
        }
        return questions;
    };

    const moveToNextQuestion = () => {
        const mcQuestions = extractQuestions(getContent());
        if (currentQuestionIndex < mcQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setAnswered(false);
        }
    };

    const mcContent = getContent();
    const mcQuestions = extractQuestions(mcContent);
    
    if (mcQuestions.length === 0) {
        return (
            <div className="quiz-activity">
                <h3>{activity.title}</h3>
                <p>{activity.instructions}</p>
                <div className="error-message">
                    <p>This activity appears to be missing content.</p>
                </div>
            </div>
        );
    }

    const currentQuestion = mcQuestions[currentQuestionIndex];
    let options = [];

    if (currentQuestion) {
        if (Array.isArray(currentQuestion.options)) {
            options = currentQuestion.options;
        } else if (currentQuestion.options && typeof currentQuestion.options === 'object') {
            options = Object.values(currentQuestion.options);
        }
    }

    // Shuffle options when question changes
    useEffect(() => {
        if (options.length > 0) {
            const shuffled = shuffleArray(options.map((option, originalIndex) => ({
                option,
                originalIndex
            })));
            setShuffledOptions(shuffled);
        }
    }, [currentQuestionIndex, JSON.stringify(options)]);

    const handleSubmitAnswer = (shuffledItem, shuffledIndex) => {
        if (answered) return;
        submitAnswer({
            questionIndex: currentQuestionIndex,
            selectedOption: shuffledItem.originalIndex // Send the original index
        });
        setAnswered(true);
    };

    return (
        <div className="quiz-activity">
            <h3>{activity.title}</h3>
            <p>{activity.instructions}</p>

            <h4>{currentQuestion.question || currentQuestion.text || "Question"}</h4>
            <div className="flex flex-row gap-2 py-2 overflow-x-auto">
                {shuffledOptions.length > 0 ? (
                    shuffledOptions.map((shuffledItem, shuffledIndex) => (
                        <button
                            key={shuffledIndex}
                            onClick={() => handleSubmitAnswer(shuffledItem, shuffledIndex)}
                            className={`flex-1 min-w-[120px] p-3 rounded-lg transition-colors whitespace-nowrap ${
                                answered 
                                    ? 'bg-gray-200 dark:bg-gray-700 cursor-default text-gray-800 dark:text-gray-200' 
                                    : 'bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
                            } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={submitting || answered}
                        >
                            {typeof shuffledItem.option === 'object' ? shuffledItem.option.text : shuffledItem.option}
                        </button>
                    ))
                ) : (
                    <p className="no-options">No answer options available</p>
                )}
            </div>
        </div>
    );
};

export default MultipleChoiceActivity;