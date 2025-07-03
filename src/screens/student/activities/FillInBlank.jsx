import { useState, useEffect, useRef } from "react";
import { Lightbulb } from "lucide-react";

const FillInBlankGame = ({ 
    activity, 
    content, 
    submitting, 
    submitAnswer, 
    onComplete = () => {} 
}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [answered, setAnswered] = useState(false);
    const [activeBlankIndex, setActiveBlankIndex] = useState(null);
    const [feedback, setFeedback] = useState({});
    const inputRef = useRef(null);

    const isMultiQuestion = Array.isArray(content?.questions);
    const questionObj = isMultiQuestion ? content.questions[currentQuestionIndex] : content;
    const { questionText = "", blanks = [], hints = [], explanation = "" } = isMultiQuestion
        ? {
            questionText: questionObj?.question || "",
            blanks: questionObj?.blanks || [],
            hints: questionObj?.hints || [],
            explanation: questionObj?.explanation || ""
        }
        : content || {};

    useEffect(() => {
        setUserAnswers([]);
        setAnswered(false);
        setCurrentAnswer("");
        setActiveBlankIndex(null);
        setFeedback({});
    }, [currentQuestionIndex, content]);

    useEffect(() => {
        if (questionText) {
            const blankCount = getBlankCount(questionText);
            setUserAnswers(new Array(blankCount).fill(""));
        }
    }, [questionText]);

    useEffect(() => {
        if (activeBlankIndex !== null && inputRef.current) {
            inputRef.current.focus();
        }
    }, [activeBlankIndex]);

    const getBlankCount = (questionText) => {
        const parts = questionText.split(/_+/g);
        return parts.length - 1;
    };

    const getWordCount = (questionText, blankIndex) => {
        const parts = questionText.split(/_+/g);
        if (blankIndex >= parts.length - 1) return 1;
        
        const beforeBlank = parts[blankIndex];
        const afterBlank = parts[blankIndex + 1];
        const blankText = questionText.substring(
            beforeBlank.length,
            questionText.length - afterBlank.length
        );
        
        return blankText.includes('__') ? "multiple" : 1;
    };

    const handleAnswer = async (blankIndex) => {
        if (!currentAnswer.trim() || submitting || answered) return;

        try {
            const correctAnswer = isMultiQuestion
                ? (questionObj.answer?.[blankIndex] || questionObj.blanks?.[blankIndex]?.answer || "")
                : blanks[blankIndex]?.answer || "";
            const alternatives = isMultiQuestion
                ? (questionObj.alternatives?.[blankIndex] || questionObj.blanks?.[blankIndex]?.alternatives || [])
                : blanks[blankIndex]?.alternatives || [];
            
            const answerData = isMultiQuestion
                ? {
                    questionIndex: currentQuestionIndex,
                    blankIndex: blankIndex,
                    answer: currentAnswer.trim(),
                    acceptableAnswers: {
                        [currentQuestionIndex]: {
                            [blankIndex]: [correctAnswer, ...alternatives].filter(Boolean)
                        }
                    }
                }
                : {
                    blankIndex: blankIndex,
                    answer: currentAnswer.trim(),
                    acceptableAnswers: [correctAnswer, ...alternatives].filter(Boolean)
                };

            setAnswered(true);
            await submitAnswer?.(answerData);
            
            const newAnswers = [...userAnswers];
            newAnswers[blankIndex] = currentAnswer.trim();
            setUserAnswers(newAnswers);
            
            const normalizedUserAnswer = currentAnswer.trim().toLowerCase();
            const normalizedCorrectAnswer = correctAnswer.toLowerCase();
            const normalizedAlternatives = alternatives.map(alt => alt.toLowerCase());
            
            const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
            const isAlternative = normalizedAlternatives.some(alt => alt === normalizedUserAnswer);
            
            if (isCorrect) {
                setFeedback(prev => ({
                    ...prev,
                    [blankIndex]: { correct: true }
                }));
            } else if (isAlternative) {
                setFeedback(prev => ({
                    ...prev,
                    [blankIndex]: {
                        correct: true,
                        isAlternative: true,
                        correctAnswer: correctAnswer
                    }
                }));
            } else {
                setFeedback(prev => ({
                    ...prev,
                    [blankIndex]: {
                        correct: false,
                        correctAnswer: correctAnswer
                    }
                }));
            }
            
            setCurrentAnswer("");
            setActiveBlankIndex(null);
            
            const blankCount = getBlankCount(questionText);
            const filledBlanks = newAnswers.filter(answer => answer.trim() !== "").length;

            if (filledBlanks === blankCount) {
                setTimeout(async () => {
                    if (isMultiQuestion && currentQuestionIndex < content.questions.length - 1) {
                        setCurrentQuestionIndex(prev => prev + 1);
                    } else {
                        await submitAnswer?.({
                            completed: true,
                            questionIndex: currentQuestionIndex,
                            allAnswers: newAnswers
                        });
                        if (typeof onComplete === 'function') onComplete();
                    }
                }, 1500);
            } else {
                setTimeout(() => {
                    setFeedback(prev => {
                        const newFeedback = { ...prev };
                        delete newFeedback[blankIndex];
                        return newFeedback;
                    });
                    setAnswered(false);
                }, 1500);
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            setAnswered(false);
        }
    };

    if (isMultiQuestion && currentQuestionIndex >= content.questions.length) {
        return (
            <div className="!p-6 !space-y-6 !bg-white !rounded-lg !shadow-md">
                <h2 className="!text-2xl !font-bold !text-center">Activity Complete!</h2>
            </div>
        );
    }

    if (!questionText) {
        return (
            <div className="!p-6 !space-y-6 !bg-white !rounded-lg !shadow-md">
                <h2 className="!text-2xl !font-bold !text-center">Loading question...</h2>
            </div>
        );
    }

    const parts = questionText.split(/_+/g);
    const blankCount = getBlankCount(questionText);

    return (
        <div className="!p-6 !space-y-6 !bg-white !rounded-lg !shadow-md">
            <div className="!flex !justify-between !items-center">
                <div className="!text-lg !font-medium">
                    {activity?.title || "Fill in the Blanks"}
                </div>
            </div>

            <div className="!space-y-6">
                <div className="!flex !flex-wrap !gap-2 !items-center">
                    {parts.map((part, index) => {
                        if (index < parts.length - 1) {
                            const isActive = activeBlankIndex === index;
                            const isAnswered = userAnswers[index];
                            const wordCount = getWordCount(questionText, index);
                            
                            return (
                                <div key={index} className="!flex !items-center !gap-2">
                                    <span className="!text-gray-700">{part}</span>
                                    <button
                                        className={`!px-4 !py-2 !border !rounded-md focus:!outline-none focus:!ring-2 focus:!ring-blue-500 transition-all duration-300 ${
                                            isActive ? '!bg-blue-50 !border-blue-500' : 
                                            isAnswered ? '!bg-green-50 !border-green-500' : 
                                            '!bg-gray-50 !border-gray-300'
                                        }`}
                                        onClick={() => {
                                            if (!isAnswered) {
                                                setActiveBlankIndex(index);
                                                setCurrentAnswer("");
                                            }
                                        }}
                                        disabled={submitting || isAnswered}
                                    >
                                        {isAnswered ? userAnswers[index] : '_'.repeat(wordCount === "multiple" ? 2 : 1)}
                                    </button>
                                </div>
                            );
                        }
                        return <span key={index} className="!text-gray-700">{part}</span>;
                    })}
                </div>

                <div className="!space-y-2">
                    {Object.entries(feedback).map(([blankIndex, fb]) => (
                        <div key={blankIndex} className={`!text-sm transition-opacity duration-300 ${fb.correct ? '!text-green-500' : '!text-red-500'}`}>
                            {fb.correct ? (
                                fb.isAlternative ? (
                                    <div>
                                        Alternative accepted. Main answer: "{fb.correctAnswer}"
                                    </div>
                                ) : null
                            ) : (
                                <div>
                                    Correct answer is "{fb.correctAnswer}"
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {activeBlankIndex !== null && (
                    <div className="!flex !gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            className="!flex-1 !px-4 !py-2 !border !rounded-md focus:!outline-none focus:!ring-2 focus:!ring-blue-500 transition-all duration-300"
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            placeholder={`Type ${getWordCount(questionText, activeBlankIndex) === "multiple" ? "multiple" : "a"} word${getWordCount(questionText, activeBlankIndex) === "multiple" ? "s" : ""} here...`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleAnswer(activeBlankIndex);
                                }
                            }}
                            disabled={answered}
                        />
                        <button 
                            className="!px-4 !py-2 !text-white !bg-blue-600 !rounded-md hover:!bg-blue-700 focus:!outline-none focus:!ring-2 focus:!ring-blue-500 transition-all duration-300"
                            onClick={() => handleAnswer(activeBlankIndex)}
                            disabled={answered}
                        >
                            {answered ? 'Submitted' : 'Submit'}
                        </button>
                    </div>
                )}

                {hints.length > 0 && (
                    <div className="!space-y-2">
                        <button 
                            className="!flex !items-center !gap-2 !px-4 !py-2 !text-blue-600 hover:!text-blue-800 transition-colors duration-300"
                            onClick={() => setShowFeedback(!showFeedback)}
                        >
                            <Lightbulb className="!w-4 !h-4" /> Hint
                        </button>

                        {showFeedback && (
                            <div className="!p-4 !bg-gray-50 !rounded-md transition-all duration-300">
                                {hints.map((hint, index) => (
                                    <p key={index} className="!text-gray-600">{hint}</p>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {explanation && userAnswers.every(a => a.trim() !== "") && (
                    <div className="!p-4 !bg-blue-50 !rounded-md">
                        <p className="!text-blue-700"><strong>Explanation:</strong> {explanation}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FillInBlankGame;