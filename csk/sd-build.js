import { register } from '@tokens-studio/sd-transforms';
import StyleDictionary from 'style-dictionary';
import fs from 'fs';

/**
 * Might be useful for if we need to generate css under a different selector from :root
 * https://github.com/amzn/style-dictionary/issues/448
 */

// will register them on StyleDictionary object
// that is installed as a dependency of this package.
register(StyleDictionary, {
    excludeParentKeys: true // needs to be false for multi file mode, perhaps?
});

const sd = new StyleDictionary({
  // make sure to have source match your token files!
  // be careful about accidentally matching your package.json or similar files that are not tokens
  source: ['csk/test.json', 'csk/test-copy.json'],
  log: {"verbosity" : "verbose"},
  preprocessors: ['tokens-studio'], // <-- since 0.16.0 this must be explicit
  platforms: {
    general: {
      transformGroup: 'tokens-studio', // <-- apply the tokens-studio transformGroup to apply all transforms
      transforms: ['name/kebab'], // <-- add a token name transform for generating token names, default is camel
      buildPath: 'csk/build/',
      files: [
        {
          destination: 'token.css',
          format: 'css/variables',
          filter: function(token){
            return token.path.includes('base')
          },
          options: {
            showFileHeader: true,
            outputReferences: true
          }
        },
        {
            destination: 'tokens-temp.css',
            format: 'css/variables',
            filter: function(token) {
                return token.path.includes('button')
            },
            options: {
                selector: ".button",
                showFileHeader: true,
                outputReferences: true
            }
        }
      ],
      actions: ['mergeCssFiles']
    }
  },
});

sd.registerAction({
    name: 'mergeCssFiles',
    do: function(dictionary, config){
        console.log("merging temporary files")
        const tempFile = config.buildPath + config.files[1].destination;
        const destFile = config.buildPath + config.files[0].destination;
        fs.appendFile(destFile, fs.readFileSync(tempFile), (err) => {
            if (err) {
              console.error('Error appending file:', err);
            } else {
              console.log('File appended successfully.');
              
              fs.unlink(tempFile, (err) => {
                if (err) {
                  console.error('Error deleting temporary file:', err);
                  return;
                }
          
                console.log('Temporary file deleted successfully.');
              });

            }
          });          
    }
});

await sd.cleanAllPlatforms();
await sd.buildAllPlatforms();