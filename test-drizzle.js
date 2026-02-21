try {
    import('drizzle-orm/mongodb').then(() => {
        console.log('Drizzle MongoDB found');
    }).catch((e) => {
        console.log('Drizzle MongoDB NOT found:', e.message);
    });
} catch (e) {
    console.log('Import failed:', e.message);
}
