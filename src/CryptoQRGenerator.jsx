import React, { useState, useEffect, useRef } from 'react';
import { QrCode, ArrowLeftRight, Copy, Download, Check, Wallet } from 'lucide-react';

const CRYPTOS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', icon: '₿' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', color: '#627EEA', icon: 'Ξ' },
  { id: 'tether', symbol: 'USDT', name: 'Tether', color: '#26A17B', icon: '₮' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', color: '#F3BA2F', icon: 'B' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', color: '#14F195', icon: 'S' }
];

const FIATS = [
  { code: 'usd', symbol: '$', name: 'US Dollar' },
  { code: 'eur', symbol: '€', name: 'Euro' }
];

export default function CryptoQRGenerator() {
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTOS[0]);
  const [walletAddress, setWalletAddress] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [fiatAmount, setFiatAmount] = useState('');
  const [selectedFiat, setSelectedFiat] = useState(FIATS[0]);
  const [conversionMode, setConversionMode] = useState('crypto'); // 'crypto' or 'fiat'
  const [prices, setPrices] = useState({});
  const [qrDataURL, setQrDataURL] = useState('');
  const [copied, setCopied] = useState(false);
  const [, setLoading] = useState(false);
  useRef(null);
// Fetch prices from CoinGecko
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = CRYPTOS.map(c => c.id).join(',');
        const currencies = FIATS.map(f => f.code).join(',');
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${currencies}`
        );
        const data = await response.json();
        setPrices(data);
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle conversion
  useEffect(() => {
    if (!prices[selectedCrypto.id]) return;

    const price = prices[selectedCrypto.id][selectedFiat.code];

    if (conversionMode === 'crypto' && cryptoAmount) {
      const fiat = (parseFloat(cryptoAmount) * price).toFixed(2);
      setFiatAmount(fiat);
    } else if (conversionMode === 'fiat' && fiatAmount) {
      const crypto = (parseFloat(fiatAmount) / price).toFixed(8);
      setCryptoAmount(crypto);
    }
  }, [cryptoAmount, fiatAmount, conversionMode, prices, selectedCrypto, selectedFiat]);

  // Generate QR Code
  useEffect(() => {
    if (!walletAddress || !cryptoAmount) {
      setQrDataURL('');
      return;
    }

    const generateQR = async () => {
      setLoading(true);
      try {
        const QRCode = (await import('qrcode')).default;

        // Build payment URI
        let uri;
        switch (selectedCrypto.symbol) {
          case 'BTC':
            uri = `bitcoin:${walletAddress}?amount=${cryptoAmount}`;
            break;
          case 'ETH':
          case 'USDT':
          case 'BNB':
            uri = `ethereum:${walletAddress}?value=${parseFloat(cryptoAmount) * 1e18}`;
            break;
          case 'SOL':
            uri = `solana:${walletAddress}?amount=${cryptoAmount}`;
            break;
          default:
            uri = walletAddress;
        }

        const dataURL = await QRCode.toDataURL(uri, {
          width: 300,
          margin: 2,
          color: {
            dark: selectedCrypto.color,
            light: '#0a0a0a'
          }
        });

        setQrDataURL(dataURL);
      } catch (error) {
        console.error('QR Generation error:', error);
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [walletAddress, cryptoAmount, selectedCrypto]);

  const handleCryptoChange = (value) => {
    setConversionMode('crypto');
    setCryptoAmount(value);
  };

  const handleFiatChange = (value) => {
    setConversionMode('fiat');
    setFiatAmount(value);
  };

  const swapConversion = () => {
    setConversionMode(mode => mode === 'crypto' ? 'fiat' : 'crypto');
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    if (!qrDataURL) return;
    const link = document.createElement('a');
    link.download = `${selectedCrypto.symbol}-payment-qr.png`;
    link.href = qrDataURL;
    link.click();
  };

  const currentPrice = prices[selectedCrypto.id]?.[selectedFiat.code];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(${selectedCrypto.color}22 1px, transparent 1px),
            linear-gradient(90deg, ${selectedCrypto.color}22 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-flow 20s linear infinite'
        }} />
      </div>

      {/* Gradient orbs */}
      <div className="fixed top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
           style={{ background: `radial-gradient(circle, ${selectedCrypto.color}, transparent)` }} />
      <div className="fixed bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
           style={{ background: `radial-gradient(circle, ${selectedCrypto.color}, transparent)` }} />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-3 tracking-tight sm:tracking-tighter bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
            Crypto QR Generator
          </h1>
          <p className="text-gray-400 text-sm sm:text-base lg:text-lg font-light tracking-wide px-2">
            Generate secure payment QR codes with real-time conversion
          </p>
        </div>

        {/* Crypto Toggle */}
        <div className="mb-8 flex justify-center">
          <div className="grid grid-cols-5 bg-[#141414] p-2 rounded-2xl border border-gray-800 shadow-2xl relative w-full max-w-md">
            {/* Sliding background */}
            <div
              className="absolute top-2 h-[calc(100%-16px)] rounded-xl transition-all duration-300 ease-out"
              style={{
                left: `calc(8px + ${CRYPTOS.findIndex(c => c.id === selectedCrypto.id)} * ((100% - 16px) / ${CRYPTOS.length}))`,
                width: `calc((100% - 16px) / ${CRYPTOS.length})`,
                background: selectedCrypto.color,
                boxShadow: `0 0 20px ${selectedCrypto.color}66`
              }}
            />

            {CRYPTOS.map((crypto) => (
              <button
                key={crypto.id}
                onClick={() => setSelectedCrypto(crypto)}
                className="relative z-10 h-20 flex flex-col items-center justify-center gap-1 transition-all duration-300"
              >
                <span className="text-lg sm:text-2xl font-bold" style={{
                  color: selectedCrypto.id === crypto.id ? '#0a0a0a' : crypto.color,
                  transition: 'color 0.3s'
                }}>
                  {crypto.icon}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold" style={{
                  color: selectedCrypto.id === crypto.id ? '#0a0a0a' : '#888',
                  transition: 'color 0.3s'
                }}>
                  {crypto.symbol}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            {/* Wallet Address */}
            <div className="bg-[#141414] border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl">
              <label className="block text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wider">
                <Wallet className="inline w-4 h-4 mr-2" />
                Wallet Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder={`Enter ${selectedCrypto.name} address`}
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 sm:py-4 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors font-mono text-sm"
                />
                {walletAddress && (
                  <button
                    onClick={copyAddress}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                )}
              </div>
            </div>

            {/* Amount Conversion */}
            <div className="bg-[#141414] border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl">
              <label className="block text-sm font-semibold mb-4 text-gray-400 uppercase tracking-wider">
                Amount & Conversion
              </label>

              {/* Crypto Amount */}
              <div className="mb-3">
                <div className="relative">
                  <input
                    type="number"
                    value={cryptoAmount}
                    onChange={(e) => handleCryptoChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 sm:py-4 pr-20 text-white text-xl sm:text-2xl font-bold placeholder-gray-700 focus:outline-none focus:border-gray-500 transition-colors"
                    step="any"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">
                    {selectedCrypto.symbol}
                  </span>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center my-3">
                <button
                  onClick={swapConversion}
                  className="p-2 bg-[#0a0a0a] border border-gray-700 rounded-lg hover:bg-gray-800 transition-all hover:scale-110"
                  style={{ color: selectedCrypto.color }}
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </button>
              </div>

              {/* Fiat Amount */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="number"
                    value={fiatAmount}
                    onChange={(e) => handleFiatChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 sm:py-4 pr-20 text-white text-xl sm:text-2xl font-bold placeholder-gray-700 focus:outline-none focus:border-gray-500 transition-colors"
                    step="any"
                  />
                  <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex gap-1 sm:gap-2">
                    {FIATS.map(fiat => (
                      <button
                        key={fiat.code}
                        onClick={() => setSelectedFiat(fiat)}
                        className={`px-2 py-1 rounded text-xs sm:text-sm font-semibold transition-colors ${
                          selectedFiat.code === fiat.code 
                            ? 'bg-gray-700 text-white' 
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {fiat.code.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Current Price */}
              {currentPrice && (
                <div className="text-center py-3 px-4 bg-[#0a0a0a] rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Current Rate</div>
                  <div className="text-lg font-bold" style={{ color: selectedCrypto.color }}>
                    1 {selectedCrypto.symbol} = {selectedFiat.symbol}{currentPrice.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - QR Code */}
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl flex flex-col items-center justify-center">
            {qrDataURL ? (
              <div className="space-y-6 w-full">
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={qrDataURL}
                      alt="Payment QR Code"
                      className="w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-2xl shadow-2xl"
                      style={{ boxShadow: `0 0 40px ${selectedCrypto.color}33` }}
                    />
                    <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg"
                         style={{ backgroundColor: selectedCrypto.color, color: '#0a0a0a' }}>
                      {selectedCrypto.icon}
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <div className="text-sm text-gray-500">Scan to pay</div>
                  <div className="text-2xl sm:text-3xl font-bold" style={{ color: selectedCrypto.color }}>
                    {cryptoAmount} {selectedCrypto.symbol}
                  </div>
                  {fiatAmount && (
                    <div className="text-lg text-gray-400">
                      ≈ {selectedFiat.symbol}{parseFloat(fiatAmount).toLocaleString()}
                    </div>
                  )}
                </div>

                <button
                  onClick={downloadQR}
                  className="w-full py-3 sm:py-4 rounded-xl font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: selectedCrypto.color,
                    color: '#0a0a0a',
                    boxShadow: `0 0 20px ${selectedCrypto.color}66`
                  }}
                >
                  <Download className="w-5 h-5" />
                  Download QR Code
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-2xl bg-[#0a0a0a] border-2 border-dashed border-gray-700 flex items-center justify-center">
                  <QrCode className="w-12 h-12 sm:w-16 sm:h-16 text-gray-700" />
                </div>
                <div className="text-gray-500">
                  Enter wallet address and amount<br />to generate QR code
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 sm:mt-12 text-center space-y-3">
          <div
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#141414] border border-gray-800 rounded-full text-sm text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
            Live prices updated every 30 seconds
          </div>
          <p className="text-xs text-gray-600">
            Always verify the wallet address before making a payment
          </p>
          <p className="text-xs text-gray-500">
            &copy; 2026 MAYISSA Lemuel. Tous droits réservés.
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        @keyframes grid-flow {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
