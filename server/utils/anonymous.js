// Google Docs-style Anonymous Animals Generator

const ANIMALS = [
    { name: 'Kangaroo', emoji: '🦘', color: '#f59e0b' },
    { name: 'Elephant', emoji: '🐘', color: '#64748b' },
    { name: 'Dolphin', emoji: '🐬', color: '#0ea5e9' },
    { name: 'Penguin', emoji: '🐧', color: '#0284c7' },
    { name: 'Panda', emoji: '🐼', color: '#10b981' },
    { name: 'Tiger', emoji: '🐯', color: '#f97316' },
    { name: 'Fox', emoji: '🦊', color: '#ea580c' },
    { name: 'Koala', emoji: '🐨', color: '#8b5cf6' },
    { name: 'Otter', emoji: '🦦', color: '#06b6d4' },
    { name: 'Cheetah', emoji: '🐆', color: '#eab308' },
    { name: 'Owl', emoji: '🦉', color: '#a855f7' },
    { name: 'Giraffe', emoji: '🦒', color: '#eab308' },
    { name: 'Wolf', emoji: '🐺', color: '#475569' },
    { name: 'Lion', emoji: '🦁', color: '#d97706' },
    { name: 'Beaver', emoji: '🦫', color: '#78350f' },
    { name: 'Hedgehog', emoji: '🦔', color: '#ec4899' },
    { name: 'Chameleon', emoji: '🦎', color: '#22c55e' },
    { name: 'Falcon', emoji: '🦅', color: '#6366f1' },
    { name: 'Bear', emoji: '🐻', color: '#92400e' },
    { name: 'Rabbit', emoji: '🐰', color: '#f43f5e' },
    { name: 'Raccoon', emoji: '🦝', color: '#64748b' },
    { name: 'Squirrel', emoji: '🐿️', color: '#d97706' },
    { name: 'Zebra', emoji: '🦓', color: '#334155' },
    { name: 'Flamingo', emoji: '🦩', color: '#f43f5e' },
    { name: 'Hippo', emoji: '🦛', color: '#64748b' },
    { name: 'Llama', emoji: '🦙', color: '#14b8a6' },
    { name: 'Walrus', emoji: '🦭', color: '#0284c7' },
    { name: 'Buffalo', emoji: '🦬', color: '#78350f' }
];

function getClientIp(req) {
    if (!req) return '127.0.0.1';
    const cfIp = req.headers && req.headers['cf-connecting-ip'];
    if (cfIp) return cfIp.trim();
    const forwarded = req.headers && req.headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    const realIp = req.headers && req.headers['x-real-ip'];
    if (realIp) return realIp.trim();
    const remote = (req.socket && req.socket.remoteAddress) || '127.0.0.1';
    return remote.replace('::ffff:', '').trim();
}

function getAnonymousPersona(ipOrSeed) {
    let hash = 0;
    const str = (ipOrSeed || 'guest-1').toString();
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    const index = Math.abs(hash) % ANIMALS.length;
    const animal = ANIMALS[index];
    return {
        name: `Anonymous ${animal.name}`,
        fullName: `Anonymous ${animal.name} ${animal.emoji}`,
        animal: animal.name,
        emoji: animal.emoji,
        color: animal.color
    };
}

module.exports = {
    getClientIp,
    getAnonymousPersona,
    ANIMALS
};
