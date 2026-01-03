export const MOODS = [
    { id: "custom", emoji: "✨", label: "Custom" },
    { id: "grateful", emoji: "🙏", label: "Agradecido" },
    { id: "happy", emoji: "😊", label: "Feliz" },
    { id: "excited", emoji: "🤩", label: "Emocionado" },
    { id: "neutral", emoji: "😐", label: "Normal" },
    { id: "sad", emoji: "😔", label: "Triste" },
    { id: "tired", emoji: "😴", label: "Cansado" },
    { id: "sick", emoji: "🤒", label: "Enfermo" },
];

export const MOODS_MAP = MOODS.reduce((acc, mood) => {
    acc[mood.id] = mood.emoji;
    return acc;
}, {} as Record<string, string>);
