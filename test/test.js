/**
 * Simple test for morfeusz-ts bindings
 */

const MorfeuszFactory = require('../dist/index').default;
const { WhitespaceHandling, MorphUtils } = require('../dist/index');

console.log('=== Morfeusz-TS Test ===\n');

try {
    // Test 1: Version information
    console.log('Test 1: Version information');
    console.log('Version:', MorfeuszFactory.getVersion());
    console.log('Copyright:', MorfeuszFactory.getCopyright());
    console.log('Default Dictionary:', MorfeuszFactory.getDefaultDictName());
    console.log('✓ Version information loaded successfully\n');

    // Test 2: Create instance
    console.log('Test 2: Create instance');
    const morfeusz = MorfeuszFactory.createInstance();
    console.log('✓ Instance created successfully\n');

    // Test 3: Configure instance
    console.log('Test 3: Configure instance');
    morfeusz.setWhitespaceHandling(WhitespaceHandling.KEEP_WHITESPACES);
    const handling = morfeusz.getWhitespaceHandling();
    console.log('Whitespace handling set to:', handling);
    console.log('✓ Configuration successful\n');

    // Test 4: Get dictionary info
    console.log('Test 4: Dictionary information');
    console.log('Dictionary ID:', morfeusz.getDictID());
    console.log('Dictionary Copyright:', morfeusz.getDictCopyright());
    console.log('✓ Dictionary information retrieved\n');

    // Test 5: Analyze text
    console.log('Test 5: Analyze text');
    const text = 'test';
    const results = morfeusz.analyse(text);
    console.log('Text:', text);
    console.log('Results:', results.length);
    
    results.forEach((interp, i) => {
        console.log(`[${i}]`, {
            orth: interp.orth,
            lemma: interp.lemma,
            tag: interp.tag,
            startNode: interp.startNode,
            endNode: interp.endNode
        });
    });
    console.log('✓ Analysis successful\n');

    // Test 6: Generate forms
    console.log('Test 6: Generate forms');
    const lemma = 'test';
    const forms = morfeusz.generate(lemma);
    console.log('Lemma:', lemma);
    console.log('Generated forms:', forms.length);
    console.log('✓ Generation successful\n');

    // Test 7: IdResolver
    console.log('Test 7: IdResolver');
    const resolver = morfeusz.getIdResolver();
    console.log('Tags count:', resolver.getTagsCount());
    console.log('Names count:', resolver.getNamesCount());
    console.log('Labels count:', resolver.getLabelsCount());
    console.log('✓ IdResolver working\n');

    // Test 8: MorphUtils
    console.log('Test 8: MorphUtils');
    results.forEach((interp, i) => {
        const isIgn = MorphUtils.isIgn(interp);
        const isWhitespace = MorphUtils.isWhitespace(interp);
        console.log(`[${i}] isIgn: ${isIgn}, isWhitespace: ${isWhitespace}`);
    });
    console.log('✓ MorphUtils working\n');

    console.log('=== All tests passed! ===');
} catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
}
