// This file now serves as a fallback or for default data.
// The primary exam generation is now handled by AI.

import { Question } from "@/ai/flows/generate-exam-questions";


export const examData: { title: string; questions: Question[] } = {
  title: "Introduction to Quantum Physics",
  questions: [
    {
      id: 1,
      type: "multiple-choice" as const,
      text: "Which of the following principles states that it is impossible to know both the exact position and exact momentum of a particle at the same time?",
      options: [
        "Pauli Exclusion Principle",
        "Heisenberg Uncertainty Principle",
        "Aufbau Principle",
        "Schrödinger's Cat Paradox",
      ],
      answer: "Heisenberg Uncertainty Principle",
    },
    {
      id: 2,
      type: "text" as const,
      text: "Explain the concept of wave-particle duality in your own words. Provide at least one example of a phenomenon that demonstrates this duality.",
      answer: "Wave-particle duality is the concept in quantum mechanics that every particle or quantum entity may be described as either a particle or a wave. An example is the double-slit experiment, where electrons behave like waves when not observed, but as particles when they are."
    },
    {
      id: 3,
      type: "multiple-choice" as const,
      text: "What is a 'quantum leap' or 'quantum jump'?",
      options: [
        "The continuous movement of a particle from one location to another.",
        "A particle gaining enough energy to travel faster than light.",
        "An electron abruptly moving from one energy level to another, without passing through the space in between.",
        "The splitting of a quantum state into multiple, separate states.",
      ],
      answer: "An electron abruptly moving from one energy level to another, without passing through the space in between."
    },
    {
      id: 4,
      type: "multiple-choice" as const,
      text: "In the context of quantum mechanics, what does the wave function (ψ) of a particle represent?",
      options: [
        "The exact trajectory of the particle.",
        "The particle's kinetic energy.",
        "The probability amplitude of finding the particle at a certain point in space and time.",
        "The particle's charge.",
      ],
      answer: "The probability amplitude of finding the particle at a certain point in space and time."
    },
    {
        id: 5,
        type: "text" as const,
        text: "Briefly describe the phenomenon of quantum entanglement. What is the key characteristic that makes it so peculiar?",
        answer: "Quantum entanglement is a phenomenon where two or more quantum particles are linked in such a way that their fates are intertwined, no matter how far apart they are. The key characteristic is that measuring a property of one particle instantaneously influences the corresponding property of the other particle(s)."
    }
  ],
};
