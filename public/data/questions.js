let createQuestion = (text, answers, multiplier) => ({
    'text': text,
    'answers': answers,
    'multiplier': multiplier,
});

let createAnswer = (text, points) => ({
    'text': text,
    'points': points,
    'guessed': false,
})



let cq = createQuestion, ca = createAnswer;

const questions = [
    cq('q1', [
        ca('answer11', 35),
        ca('answer12', 21),
        ca('answer13', 17),
        ca('answer14', 8),
        ca('answer15', 3),
    ], 2),
    cq('q2', [
        ca('answer21', 38),
        ca('answer22', 30),
        ca('answer23', 12),
        ca('answer24', 11),
        ca('answer25', 3),
    ], 1),
]