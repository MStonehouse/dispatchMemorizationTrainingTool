const e = {
  sequenceType: document.getElementById("sequenceType"),
  sequenceLength: document.getElementById("sequenceLength"),
  lengthOutput: document.getElementById("lengthOutput"),
  displayTime: document.getElementById("displayTime"),
  recallDelay: document.getElementById("recallDelay"),
  allowRepeats: document.getElementById("allowRepeats"),
  sequenceDisplay: document.getElementById("sequenceDisplay"),
  instruction: document.getElementById("instruction"),
  countdown: document.getElementById("countdown"),
  answerForm: document.getElementById("answerForm"),
  answerZone: document.getElementById("answerZone"),
  lockMessage: document.getElementById("lockMessage"),
  lockText: document.getElementById("lockText"),
  answerInput: document.getElementById("answerInput"),
  startRound: document.getElementById("startRound"),
  hideSequence: document.getElementById("hideSequence"),
  checkAnswer: document.getElementById("checkAnswer"),
  nextRound: document.getElementById("nextRound"),
  feedback: document.getElementById("feedback"),
  statusBadge: document.getElementById("statusBadge"),
  correctScore: document.getElementById("correctScore"),
  attemptScore: document.getElementById("attemptScore"),
  accuracyScore: document.getElementById("accuracyScore"),
  resetScore: document.getElementById("resetScore"),
  tipText: document.getElementById("tipText"),
};
const sets = {
  numbers: "0123456789",
  letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  mixed: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
};
function renderSequence(sequence) {
  e.sequenceDisplay.replaceChildren();
  for (const character of sequence) {
    const span = document.createElement("span");
    span.className = "sequence-char";
    span.textContent = character;
    if (character === "0") span.classList.add("sequence-zero");
    e.sequenceDisplay.appendChild(span);
  }
}
const tips = [
  "Read longer sequences in small groups rather than as one continuous string.",
  "Repeat the sequence silently while it is visible.",
  "Focus on accuracy first and increase the length gradually.",
  "For mixed sequences, notice where the sequence changes between letters and numbers.",
  "Practise the same length until you can recall it consistently.",
  "Use a recall delay to practise holding information in memory for longer.",
];
let currentSequence = "",
  hideTimer = null,
  recallInterval = null;
let score = {
  correct: Number(localStorage.getItem("dispatcherCorrect")) || 0,
  attempts: Number(localStorage.getItem("dispatcherAttempts")) || 0,
};
function generateSequence(type, length, repeats) {
  const chars = sets[type];
  if (!repeats && length > chars.length)
    throw new Error(
      `Without repeats, this mode supports up to ${chars.length} characters.`,
    );
  const available = chars.split("");
  let result = "";
  for (let i = 0; i < length; i++) {
    const source = repeats ? chars : available;
    const n = Math.floor(Math.random() * source.length);
    result += source[n];
    if (!repeats) available.splice(n, 1);
  }
  return result;
}
function updateScore() {
  e.correctScore.textContent = score.correct;
  e.attemptScore.textContent = score.attempts;
  e.accuracyScore.textContent = `${score.attempts ? Math.round((score.correct / score.attempts) * 100) : 0}%`;
  localStorage.setItem("dispatcherCorrect", score.correct);
  localStorage.setItem("dispatcherAttempts", score.attempts);
}
function updateLength() {
  const max = sets[e.sequenceType.value].length;
  if (!e.allowRepeats.checked && Number(e.sequenceLength.value) > max)
    e.sequenceLength.value = max;
  e.lengthOutput.textContent = e.sequenceLength.value;
  e.answerInput.maxLength = e.sequenceLength.value;
}
function lockSettings(v) {
  e.sequenceType.disabled = v;
  e.sequenceLength.disabled = v;
  e.displayTime.disabled = v;
  e.recallDelay.disabled = v;
  e.allowRepeats.disabled = v;
}
function clearTimers() {
  if (hideTimer !== null) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (recallInterval !== null) {
    clearInterval(recallInterval);
    recallInterval = null;
  }
}
function setAnswerLocked(locked, message = "") {
  e.answerInput.disabled = locked;
  e.checkAnswer.disabled = locked;
  if (locked) {
    e.answerZone.classList.add("locked");
    e.lockMessage.classList.remove("hidden");
    e.lockText.textContent = message || "Recall locked";
  } else {
    e.answerZone.classList.remove("locked");
    e.lockMessage.classList.add("hidden");
    e.lockText.textContent = "Recall locked";
  }
}
function beginRecall() {
  clearTimers();
  e.countdown.classList.add("hidden");
  e.countdown.textContent = "";
  e.instruction.textContent = "The sequence is hidden. Enter it from memory.";
  e.statusBadge.textContent = "Recall";
  e.statusBadge.classList.remove("waiting");
  setAnswerLocked(false);
  e.answerInput.disabled = false;
  e.checkAnswer.disabled = false;
  e.answerInput.focus();
}
function beginRecallDelay() {
  const ms = Number(e.recallDelay.value);
  if (ms === 0) {
    beginRecall();
    return;
  }
  let s = Math.ceil(ms / 1000);
  e.statusBadge.textContent = "Wait";
  e.statusBadge.classList.add("waiting");
  e.instruction.textContent = "Retention period: keep the sequence in memory.";
  e.countdown.classList.remove("hidden");
  e.countdown.textContent = s;
  setAnswerLocked(
    true,
    `Recall locked — wait ${s} ${s === 1 ? "second" : "seconds"}`,
  );
  recallInterval = setInterval(() => {
    s--;
    if (s <= 0) {
      beginRecall();
      return;
    }
    e.countdown.textContent = s;
    e.lockText.textContent = `Recall locked — wait ${s} ${s === 1 ? "second" : "seconds"}`;
  }, 1000);
}
function hideCurrentSequence() {
  if (hideTimer !== null) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  e.sequenceDisplay.textContent = "•".repeat(currentSequence.length);
  e.hideSequence.classList.add("hidden");
  beginRecallDelay();
}
function startRound() {
  clearTimers();
  e.feedback.className = "feedback hidden";
  e.feedback.textContent = "";
  e.answerInput.value = "";
  e.countdown.classList.add("hidden");
  e.countdown.textContent = "";
  e.statusBadge.classList.remove("waiting");
  setAnswerLocked(true, "Input locked while the sequence is visible");
  e.startRound.classList.add("hidden");
  e.nextRound.classList.add("hidden");
  lockSettings(true);
  try {
    currentSequence = generateSequence(
      e.sequenceType.value,
      Number(e.sequenceLength.value),
      e.allowRepeats.checked,
    );
  } catch (err) {
    e.feedback.textContent = err.message;
    e.feedback.className = "feedback incorrect";
    e.startRound.classList.remove("hidden");
    setAnswerLocked(false);
    lockSettings(false);
    return;
  }
  renderSequence(currentSequence);
  e.instruction.textContent = "Memorize this sequence before it disappears.";
  e.statusBadge.textContent = "Memorize";
  const delay = Number(e.displayTime.value);
  if (delay === 0) e.hideSequence.classList.remove("hidden");
  else {
    e.hideSequence.classList.add("hidden");
    hideTimer = setTimeout(hideCurrentSequence, delay);
  }
}
function checkAnswer(event) {
  event.preventDefault();
  const answer = e.answerInput.value.trim().toUpperCase();
  if (!answer) {
    e.feedback.textContent = "Enter an answer before checking.";
    e.feedback.className = "feedback incorrect";
    e.answerInput.focus();
    return;
  }
  score.attempts++;
  const correct = answer === currentSequence;
  if (correct) {
    score.correct++;
    e.feedback.innerHTML = `Correct! The sequence was <strong>${currentSequence}</strong>.`;
    e.feedback.className = "feedback correct";
  } else {
    e.feedback.innerHTML = `Your answer was <strong>${answer}</strong>. The correct sequence was <strong>${currentSequence}</strong>.`;
    e.feedback.className = "feedback incorrect";
  }
  updateScore();
  renderSequence(currentSequence);
  e.instruction.textContent = "Review the correct sequence, then continue.";
  e.answerInput.disabled = true;
  e.checkAnswer.disabled = true;
  e.nextRound.classList.remove("hidden");
  e.statusBadge.textContent = correct ? "Correct" : "Review";
  e.statusBadge.classList.remove("waiting");
  e.tipText.textContent = tips[Math.floor(Math.random() * tips.length)];
}
function prepareNextRound() {
  clearTimers();
  e.feedback.className = "feedback hidden";
  e.feedback.textContent = "";
  e.sequenceDisplay.textContent = "•".repeat(Number(e.sequenceLength.value));
  e.instruction.textContent = "Press “Start round” to reveal a sequence.";
  e.countdown.classList.add("hidden");
  e.countdown.textContent = "";
  e.statusBadge.textContent = "Ready";
  e.statusBadge.classList.remove("waiting");
  e.startRound.classList.remove("hidden");
  e.nextRound.classList.add("hidden");
  setAnswerLocked(false);
  e.answerInput.disabled = true;
  e.checkAnswer.disabled = true;
  lockSettings(false);
  e.startRound.focus();
}
e.sequenceLength.addEventListener("input", updateLength);
e.sequenceType.addEventListener("change", updateLength);
e.allowRepeats.addEventListener("change", updateLength);
e.startRound.addEventListener("click", startRound);
e.hideSequence.addEventListener("click", hideCurrentSequence);
e.answerForm.addEventListener("submit", checkAnswer);
e.nextRound.addEventListener("click", prepareNextRound);
e.resetScore.addEventListener("click", () => {
  score = { correct: 0, attempts: 0 };
  updateScore();
});
updateLength();
updateScore();
