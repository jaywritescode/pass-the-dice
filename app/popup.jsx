import './styles/popup.scss';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import {
  Field, Control, Input, Label,
} from 'react-bulma-components/lib/components/form';
import Section from 'react-bulma-components/lib/components/section';
import Container from 'react-bulma-components/lib/components/container';
import Button from 'react-bulma-components/lib/components/button';
import Icon from 'react-bulma-components/lib/components/icon';
import Columns from 'react-bulma-components/lib/components/columns';

import { LOCAL_STORAGE_KEY, WORD_LISTS } from './shared/constants';
import { roll } from './shared/utils';


/*
 *
 * App is the root component of the popup.html page.
 *
 */
export default class App extends React.Component {
  constructor(props) {
    super(props);

    const { name: wordsFile, dice } = WORD_LISTS[0];
    this.state = {
      chosenWords: [],
      passphrase: '',
      numWords: 5,
      showAdvanced: false,
      canContainSpaces: true,
      capitalizeEachWord: true,
      mustIncludeDigit: false,
      mustIncludeUppercase: false,
      wordsFile,
      dice,
    };
  }

  componentDidMount() {
    this.fetchWords();
  }

  /**
   * Choose words at random from the word list.
   *
   * @param {function(string[]):void} callback - the consumer for the randomly chosen words
   * @param {integer} count - the number of words in the passphrase
   */
  fetchWords() {
    const { wordsFile, dice, numWords } = this.state;

    chrome.storage.local.get(LOCAL_STORAGE_KEY, (result) => {
      const wordsMap = result[LOCAL_STORAGE_KEY][wordsFile];
      const words = _.times(numWords, () => wordsMap[roll(dice)]);

      this.setState({
        chosenWords: words,
        passphrase: this.transform(words),
      });
    });
  }

  /**
   * Transforms the sequence of chosen words.
   *
   * @param {string[]} words
   */
  transform(words) {
    const { 
      canContainSpaces, 
      capitalizeEachWord,
      mustIncludeDigit, 
      mustIncludeUppercase,
      mustIncludeSpecialCharacter,
    } = this.state;
    
    if (!canContainSpaces && capitalizeEachWord) {
      words = words.map(_.upperFirst);
    }
    else if (mustIncludeUppercase) {
      words[0] = _.upperFirst(words[0])
    }

    return (mustIncludeDigit ? '0' : '') + 
      words.join(canContainSpaces ? ' ' : '') + 
      (mustIncludeSpecialCharacter ? '!' : '');
  }

  render() {
    const {
      passphrase,
      wordsFile,
      numWords,
      showAdvanced,
      canContainSpaces,
      capitalizeEachWord,
      mustIncludeDigit,
      mustIncludeUppercase,
      mustIncludeSpecialCharacter,
    } = this.state;

    return (
      <Section>
        <Container>
          <PasswordDisplay passphrase={passphrase} />

          <Columns breakpoint="mobile">
            <Columns.Column size="two-fifths">
              <Field>
                <Control>
                  <Button color="dark" outlined onClick={() => this.fetchWords()}>Get Password</Button>
                </Control>
              </Field>
            </Columns.Column>
            <Columns.Column>
              <Field>
                <Control>
                  <Button
                    fullwidth
                    onClick={() => this.setState((state) => ({
                      showAdvanced: !state.showAdvanced,
                    }))}
                  >
                    Advanced
                  </Button>
                </Control>
              </Field>
              {
                showAdvanced
                && (
                <>
                  <Field>
                    <Label>Word list</Label>
                    <Control>
                      {WORD_LISTS.map(({ text, name, dice }) => (
                        <Radio
                          name="wordsFile"
                          onChange={() => this.setState({
                            wordsFile: name,
                            dice,
                          }, () => this.fetchWords())}
                          checked={wordsFile === name}
                          value={name}
                          key={name}
                        >
                          {text}
                        </Radio>
                      ))}
                    </Control>
                  </Field>
                  <Field horizontal>
                    <div className="field-label is-normal">
                      <Label htmlFor="numWords">Words</Label>
                    </div>
                    <div className="field-body">
                      <Field>
                        <Control>
                          <Input
                            id="numWords"
                            type="number"
                            value={numWords.toString()}
                            min={1}
                            onChange={e => this.setState({
                              numWords: e.target.value,
                            }, () => this.fetchWords())}
                          />
                        </Control>
                      </Field>
                    </div>
                  </Field>
                  <Switch 
                    name="canContainSpaces" 
                    checked={canContainSpaces} 
                    onChange={() => {
                      this.setState((state) => {
                        return {canContainSpaces: !state.canContainSpaces}
                      }, this.fetchWords())
                    }}
                  >
                    Allow spaces
                  </Switch>
                  {
                    !canContainSpaces
                    && (
                      <Switch
                        name="capitalizeEachWord"
                        checked={capitalizeEachWord}
                        onChange={() => {
                          this.setState((state) => {
                            return {capitalizeEachWord: !state.capitalizeEachWord}
                          }, this.fetchWords())
                        }}
                      >
                        Capitalize each word
                      </Switch>
                    )
                  }
                  <Switch
                    name="mustIncludeDigit"
                    checked={mustIncludeDigit}
                    onChange={() => {
                      this.setState((state) => {
                        return {mustIncludeDigit: !state.mustIncludeDigit}
                      }, this.fetchWords())
                    }}
                  >
                    Require digit
                  </Switch>
                  <Switch
                    name="mustIncludeUppercase"
                    checked={mustIncludeUppercase}
                    onChange={() => {
                      this.setState((state) => {
                        return {mustIncludeUppercase: !state.mustIncludeUppercase}
                      }, this.fetchWords())
                    }}
                  >
                    Require uppercase
                  </Switch>
                  <Switch
                    name="mustIncludeSpecialCharacter"
                    checked={mustIncludeSpecialCharacter}
                    onChange={() => {
                      this.setState((state) => {
                        return {mustIncludeSpecialCharacter: !state.mustIncludeSpecialCharacter}
                      }, this.fetchWords())
                    }}
                  >
                    Require special character
                  </Switch>
                </>
                )
              }
            </Columns.Column>
          </Columns>
        </Container>
      </Section>
    );
  }
}

/*
 *
 * PasswordDisplay is a read-only input component that shows the randomly chosen
 * passphrase and also a button to copy the passphrase to the clipboard.
 *
 */
function PasswordDisplay(props) {
  const { passphrase } = props;

  return (
    <Field kind="addons">
      <Control>
        <Input
          type="text"
          color="dark"
          value={passphrase}
          readOnly
          id="password"
          data-test="password-field"
        />
      </Control>
      <Control>
        <CopyButton passphrase={passphrase} />
      </Control>
    </Field>
  );
}

PasswordDisplay.propTypes = {
  passphrase: PropTypes.string.isRequired,
};

/*
 *
 * CopyButton is a button that, when clicked, copies the passphrase to the clipbaord.
 *
 */
function CopyButton(props) {
  const { passphrase } = props;

  const handleClick = () => {
    window.navigator.clipboard.writeText(passphrase);
  };

  return (
    <Button color="dark" id="copy" renderAs="a" onClick={handleClick}>
      <Icon>
        <span className="far fa-copy" />
      </Icon>
    </Button>
  );
}

CopyButton.propTypes = {
  passphrase: PropTypes.string.isRequired,
};

/*
 *
 * Radio is a React wrapper around the Checkradio element in the bulma-extensions package.
 *
 */
function Radio(props) {
  const {
    name, value, checked, onChange, children,
  } = props;

  return (
    <>
      <input type="radio" id={value} className="is-checkradio" name={name} checked={checked} onChange={onChange} />
      <label htmlFor={value} style={{fontSize: '0.8rem'}}>
        {children}
      </label>
    </>
  );
}

Radio.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  children: PropTypes.node,
};

/*
 *
 * Switch is a React wrapper around the Switch element in the bulma-extensions package.
 *
 */
function Switch(props) {
  const {
    name, checked, children, onChange
  } = props;

  return (
    <Field>
      <input type="checkbox" name={name} checked={checked} className="switch" onChange={_.noop} />
      <label 
        htmlFor={name} 
        onClick={onChange}
        style={{fontSize: '0.8rem'}}
      >
        {children}
      </label>
    </Field>
  )
}

Switch.propTypes = {
  name: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  children: PropTypes.node,
};

/*
 * Inject the React component into the DOM.
 */
document.addEventListener(
  'DOMContentLoaded', function() { 
    ReactDOM.render(<App />, document.getElementById('app')); 
  }
);