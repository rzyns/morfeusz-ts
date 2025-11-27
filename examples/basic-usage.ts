/**
 * Example usage of morfeusz-ts
 * 
 * This example demonstrates basic and advanced usage of the Morfeusz 2
 * TypeScript bindings.
 */

import MorfeuszFactory, {
  MorphInterpretation,
  MorphUtils,
  WhitespaceHandling,
  CaseHandling,
  Charset,
  MorfeuszUsage
} from '../dist/index';

console.log('=== Morfeusz-TS Example ===\n');

// Version information
console.log('Morfeusz Version:', MorfeuszFactory.getVersion());
console.log('Copyright:', MorfeuszFactory.getCopyright());
console.log('Default Dictionary:', MorfeuszFactory.getDefaultDictName());
console.log();

// Create instance
const morfeusz = MorfeuszFactory.createInstance();

// Configure
morfeusz.setWhitespaceHandling(WhitespaceHandling.KEEP_WHITESPACES);
morfeusz.setCaseHandling(CaseHandling.CONDITIONALLY_CASE_SENSITIVE);
morfeusz.setCharset(Charset.UTF8);

console.log('Dictionary ID:', morfeusz.getDictID());
console.log('Dictionary Copyright:', morfeusz.getDictCopyright());
console.log();

// Example 1: Basic analysis
console.log('=== Example 1: Basic Analysis ===');
const text1 = 'Ala ma kota';
console.log('Text:', text1);
const results1 = morfeusz.analyse(text1);

console.log('\nResults:');
results1.forEach((interp, i) => {
  if (!MorphUtils.isWhitespace(interp)) {
    console.log(`[${i}] ${interp.orth} -> ${interp.lemma} (${interp.tag})`);
    console.log(`     Nodes: ${interp.startNode} -> ${interp.endNode}`);
  }
});
console.log();

// Example 2: Complex word segmentation
console.log('=== Example 2: Complex Segmentation ===');
const text2 = 'zostałem';
console.log('Text:', text2);
const results2 = morfeusz.analyse(text2);

console.log('\nSegmentation:');
results2.forEach((interp, i) => {
  if (!MorphUtils.isWhitespace(interp)) {
    console.log(`[${i}] "${interp.orth}" (nodes ${interp.startNode}-${interp.endNode})`);
    console.log(`     lemma: ${interp.lemma}`);
    console.log(`     tag: ${interp.tag}`);
  }
});
console.log();

// Example 3: Using IdResolver
console.log('=== Example 3: IdResolver ===');
const resolver = morfeusz.getIdResolver();
console.log('Tags in tagset:', resolver.getTagsCount());
console.log('Named entity types:', resolver.getNamesCount());
console.log('Label combinations:', resolver.getLabelsCount());
console.log();

// Example 4: Morphological generation
console.log('=== Example 4: Morphological Generation ===');
const lemma = 'dom';
console.log('Generating forms for lemma:', lemma);
const forms = morfeusz.generate(lemma);

console.log(`\nFound ${forms.length} forms:`);
forms.slice(0, 10).forEach(form => {
  console.log(`  ${form.orth} (${form.tag})`);
});
if (forms.length > 10) {
  console.log(`  ... and ${forms.length - 10} more`);
}
console.log();

// Example 5: Unknown words
console.log('=== Example 5: Unknown Words ===');
const text5 = 'To jest xyztestxyz';
console.log('Text:', text5);
const results5 = morfeusz.analyse(text5);

const unknownWords = results5.filter(MorphUtils.isIgn);
if (unknownWords.length > 0) {
  console.log('\nUnknown words found:');
  unknownWords.forEach(word => {
    console.log(`  "${word.orth}" at nodes ${word.startNode}-${word.endNode}`);
  });
} else {
  console.log('\nNo unknown words found');
}
console.log();

// Example 6: DAG path analysis
console.log('=== Example 6: DAG Analysis ===');
const text6 = 'mam';
console.log('Text:', text6);
const results6 = morfeusz.analyse(text6).filter(r => !MorphUtils.isWhitespace(r));

console.log(`\nFound ${results6.length} interpretations:`);
results6.forEach((interp, i) => {
  console.log(`[${i}] ${interp.orth} -> ${interp.lemma} (${interp.tag})`);
});
console.log();

console.log('=== All examples completed ===');
