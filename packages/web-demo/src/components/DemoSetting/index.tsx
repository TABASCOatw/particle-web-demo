/* eslint-disable react-hooks/exhaustive-deps */
import { InfoCircleOutlined } from '@ant-design/icons';
import { ERC4337Options, UIMode, isNullish } from '@particle-network/auth';
import { ParticleChains, chains } from '@particle-network/chains';
import { Button, Input, Modal, Slider, Switch, message, notification } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import aaOptions from '../../common/config/erc4337';
import { isJson } from '../../utils';
import PnSelect from '../PnSelect';
import './index.scss';

const { TextArea } = Input;

function DemoSetting(props: any) {
    const { onChange, value: demoSetting, particle } = props;

    const customTextArea = useRef(null);
    // params
    const [chainKey, setChainKey] = useState<string>(demoSetting.chainKey);
    const [modalBorderRadius, setModalBorderRadius] = useState<number>(demoSetting.modalBorderRadius || 10);
    const [language, setLanguage] = useState<string>(demoSetting.language);
    const [theme, setTheme] = useState<string>(demoSetting.theme);
    const [walletTheme, setWalletTheme] = useState<string>(demoSetting.walletTheme);
    const [walletEntrance, setWalletEntrance] = useState<boolean>(demoSetting.walletEntrance);
    const [erc4337, setERC4337] = useState<ERC4337Options | undefined>(demoSetting.erc4337);

    const [promptSettingWhenSign, setPromptSettingWhenSign] = useState<number>(demoSetting.promptSettingWhenSign);
    const [promptMasterPasswordSettingWhenLogin, setPromptMasterPasswordSettingWhenLogin] = useState<number>(
        demoSetting.promptMasterPasswordSettingWhenLogin
    );
    const [customStyle, setCustomStyle] = useState<string>(demoSetting.customStyle);
    const [textAreaStr, setTextAreaStr] = useState<string>(customStyle);
    const [enableERC4337Prompt, setEnableERC4337Prompt] = useState<ERC4337Options>();

    const [fiatCoin, setFiatCoin] = useState<string>(localStorage.getItem('web_demo_fiat_coin') || 'USD');

    // options
    const LanguageOptions = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko'];
    const ThemeOptions = ['light', 'dark'];
    const FiatCoinOptions = ['USD', 'CNY', 'JPY', 'HKD', 'INR', 'KRW'];
    const ERC4337Types = ['DISABLE', 'BICONOMY 1.0.0', 'BICONOMY 2.0.0', 'CYBERCONNECT 1.0.0', 'SIMPLE 1.0.0'];
    const SettingWhenLoginOption = [
        { value: '0', label: 'None' },
        { value: '1', label: 'Once' },
        { value: '2', label: 'Always' },
        { value: '3', label: 'Force' },
    ];

    const chainOptions = useMemo(() => {
        const options = chains.getAllChainInfos();
        if (erc4337) {
            const aaSupportChains = aaOptions.accountContracts[erc4337.name].find(
                (item) => item.version === erc4337.version
            )!.chainIds;
            return options.filter((item) => item.chainType === 'evm' && aaSupportChains.some((id) => id === item.id));
        }
        return options;
    }, [erc4337]);

    // callback
    useEffect(() => {
        const newSetting = {
            chainKey,
            language,
            theme,
            modalBorderRadius,
            promptSettingWhenSign,
            promptMasterPasswordSettingWhenLogin,
            customStyle,
            walletTheme,
            walletEntrance,
            fiatCoin,
            erc4337,
        };
        if (onChange && JSON.stringify(demoSetting) !== JSON.stringify(newSetting)) {
            onChange({ ...newSetting });
        }
    }, [
        chainKey,
        language,
        theme,
        modalBorderRadius,
        promptSettingWhenSign,
        promptMasterPasswordSettingWhenLogin,
        customStyle,
        walletTheme,
        walletEntrance,
        fiatCoin,
        erc4337,
    ]);

    useEffect(() => {
        localStorage.setItem('dapp_particle_theme', theme);
        particle.setAuthTheme({
            uiMode: theme as UIMode,
        });
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('dapp_particle_language', language);
        particle.setLanguage(language);
    }, [language]);

    useEffect(() => {
        localStorage.setItem('dapp_particle_wallettheme', walletTheme);
    }, [walletTheme]);

    useEffect(() => {
        localStorage.setItem('dapp_particle_walletentrance', walletEntrance.toString());
    }, [walletEntrance]);

    const switchChain = async (key) => {
        const chain = ParticleChains[key];
        if (particle.auth.isLogin()) {
            await particle.switchChain(chain, true);
        } else {
            particle.setChainInfo(chain);
        }
        localStorage.setItem('dapp_particle_chain_key', key);
        console.log('trigger switch chain:', ParticleChains[chainKey]);
        setChainKey(key);
    };

    useEffect(() => {
        particle.setAuthTheme({
            // @ts-ignore
            modalBorderRadius: Number(modalBorderRadius),
        });
        localStorage.setItem('dapp_particle_modal_border_radius', modalBorderRadius + '');
    }, [modalBorderRadius]);

    const onERC4337Change = (value: String) => {
        const [name, version] = value.split(' ');
        if (name === ERC4337Types[0]) {
            localStorage.removeItem('dapp_particle_erc4337_contract');
            setERC4337(undefined);
            return;
        }
        const options: ERC4337Options = {
            name: name as any,
            version,
        };
        const currentChain = ParticleChains[chainKey];
        const aaSupportChains = aaOptions.accountContracts[options.name]?.find(
            (item) => item.version === options.version
        )?.chainIds;
        if (aaSupportChains?.includes(currentChain.id)) {
            localStorage.setItem('dapp_particle_erc4337_contract', JSON.stringify(options));
            setERC4337(options);
        } else {
            setEnableERC4337Prompt(options);
        }
    };

    const switchChainAndEnableErc4337 = async (options: ERC4337Options) => {
        let firstChainId = aaOptions.accountContracts[options.name].find((item) => item.version === options.version)!
            .chainIds[0];
        const chain = chains.getEVMChainInfoById(firstChainId);
        if (chain) {
            await switchChain(`${chain.name.toLowerCase()}-${chain.id}`);
            setERC4337(options);
            setEnableERC4337Prompt(undefined);
        }
    };

    return (
        <div className="filter-box card" style={{ flex: 1 }}>
            <h2 className="filter-title">Demo Setting</h2>
            <div className="filter-item">
                <div className="filter-label">
                    Chain:
                    <InfoCircleOutlined
                        className="info"
                        onClick={() => {
                            window.open('https://docs.particle.network/node-service/evm-chains-api', '_blank');
                        }}
                    />
                </div>
                <PnSelect
                    value={chainKey}
                    onChange={switchChain}
                    options={chainOptions.map((item) => ({
                        ...item,
                        label: item.fullname,
                        value: `${item.name.toLowerCase()}-${item.id}`,
                    }))}
                ></PnSelect>
            </div>
            <div className="filter-item">
                <div className="filter-label">Language:</div>
                <PnSelect
                    value={language}
                    onChange={setLanguage}
                    options={LanguageOptions.map((item) => ({
                        label: item,
                        value: item,
                    }))}
                ></PnSelect>
            </div>
            <div className="filter-item">
                <div className="filter-label">Auth Theme:</div>
                <PnSelect
                    value={theme}
                    onChange={setTheme}
                    options={ThemeOptions.map((item) => ({
                        label: item,
                        value: item,
                    }))}
                ></PnSelect>
            </div>
            <div className="filter-item">
                <div className="filter-label">Fiat Coin:</div>
                <PnSelect
                    value={fiatCoin}
                    onChange={(value) => {
                        setFiatCoin(value);
                        localStorage.setItem('web_demo_fiat_coin', value);
                        particle.setFiatCoin(value);
                    }}
                    options={FiatCoinOptions.map((item) => ({
                        label: item,
                        value: item,
                    }))}
                ></PnSelect>
            </div>
            <div className="filter-item">
                <div className="filter-label">ERC-4337</div>
                <PnSelect
                    value={erc4337 ? `${erc4337.name} ${erc4337.version}` : ERC4337Types[0]}
                    onChange={onERC4337Change}
                    options={ERC4337Types.map((item) => {
                        return {
                            label: item,
                            value: item,
                        };
                    })}
                ></PnSelect>
            </div>
            <div className="filter-item">
                <div className="filter-label">
                    Wallet Entrance:{' '}
                    <div style={{ display: 'inline-block' }}>
                        <Switch
                            defaultChecked={walletEntrance}
                            checked={walletEntrance}
                            onChange={setWalletEntrance}
                        ></Switch>
                    </div>
                </div>
            </div>
            {walletEntrance && (
                <div className="filter-item">
                    <div className="filter-label">Wallet Theme:</div>
                    <PnSelect
                        value={walletTheme}
                        onChange={setWalletTheme}
                        options={ThemeOptions.map((item) => ({
                            label: item,
                            value: item,
                        }))}
                    ></PnSelect>
                </div>
            )}

            <div className="filter-item">
                <div className="filter-label">Modal Border Radius:</div>
                <Slider
                    className="filter-input"
                    defaultValue={modalBorderRadius}
                    max={30}
                    min={0}
                    onAfterChange={(value) => {
                        setModalBorderRadius(value);
                    }}
                />
            </div>
            <div className="filter-item">
                <div className="filter-label">Prompt Master Password Setting When Login</div>
                <PnSelect
                    value={promptMasterPasswordSettingWhenLogin.toString()}
                    onChange={(value) => {
                        localStorage.setItem('promptMasterPasswordSettingWhenLogin', value + '');
                        setPromptMasterPasswordSettingWhenLogin(Number(value));
                    }}
                    options={SettingWhenLoginOption}
                ></PnSelect>
            </div>
            <div className="filter-item">
                <div className="filter-label">Prompt Security Setting When Sign</div>
                <PnSelect
                    value={promptSettingWhenSign.toString()}
                    onChange={(value) => {
                        localStorage.setItem('promptSettingWhenSign', value + '');
                        setPromptSettingWhenSign(Number(value));
                    }}
                    options={SettingWhenLoginOption}
                ></PnSelect>
            </div>
            <div className="filter-item">
                <div className="filter-label">
                    Wallet Custom Style:
                    <InfoCircleOutlined
                        className="info"
                        onClick={() => {
                            window.open('https://docs.particle.network/wallet-service/sdks/web', '_blank');
                        }}
                    />
                </div>

                <TextArea
                    ref={customTextArea}
                    rows={10}
                    value={textAreaStr}
                    className="filter-input"
                    // @ts-ignore
                    onInput={(e) => setTextAreaStr(e.target.value)}
                    placeholder="Please input your wallet custom style, use default style if not set"
                    defaultValue={customStyle || ''}
                />
                <div className="filter-input">
                    <Button
                        style={{ flex: 1, height: 40 }}
                        type="primary"
                        onClick={() => {
                            if (customTextArea.current) {
                                const text = (customTextArea.current as any).resizableTextArea.textArea.value;
                                try {
                                    if (text && !isJson(text)) {
                                        return notification.error({
                                            // @ts-ignore
                                            message: 'Failed to verify json',
                                        });
                                    }
                                    if (text && text.trim()) {
                                        JSON.parse(text);
                                        localStorage.setItem('customStyle', text);
                                        setTextAreaStr(text);
                                        setCustomStyle(text);
                                    } else {
                                        setCustomStyle('');
                                        setTextAreaStr('');
                                        localStorage.removeItem('customStyle');
                                    }
                                } catch (e) {
                                    message.error('JSON Parse error');
                                }
                            }
                        }}
                    >
                        RUN CUSTOM STYLE
                    </Button>
                </div>
            </div>
            <Modal
                title="Enable ERC-4337 Prompt"
                open={!isNullish(enableERC4337Prompt)}
                centered
                onCancel={() => setEnableERC4337Prompt(undefined)}
                onOk={() => switchChainAndEnableErc4337(enableERC4337Prompt!)}
            >
                {`${enableERC4337Prompt} not support current chain, click OK to automatically switch chain and enable
                ERC-4337.`}
            </Modal>
        </div>
    );
}

export default DemoSetting;
