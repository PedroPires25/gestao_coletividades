import futebolIcon from "./futebol.svg";
import basquetebolIcon from "./basquetebol.svg";
import andebolIcon from "./andebol.svg";
import futsalIcon from "./futsal.svg";
import voleibolIcon from "./voleibol.svg";
import atletismoIcon from "./atletismo.svg";
import natacaoIcon from "./natacao.svg";
import tenisIcon from "./tenis.svg";
import padelIcon from "./padel.svg";
import hoqueiIcon from "./hoquei.svg";
import ginasticaIcon from "./ginastica.svg";
import karateIcon from "./karate.svg";
import judoIcon from "./judo.svg";
import taekwondoIcon from "./taekwondo.svg";
import escaladaIcon from "./escalada.svg";
import patinagemIcon from "./patinagem.svg";
import tenisMesaIcon from "./tenis-de-mesa.svg";
import defaultIcon from "./default.svg";

export const MODALIDADE_FIGURAS = {
  Futebol: futebolIcon,
  Basquetebol: basquetebolIcon,
  Andebol: andebolIcon,
  Futsal: futsalIcon,
  Voleibol: voleibolIcon,
  Atletismo: atletismoIcon,
  Natação: natacaoIcon,
  Natacao: natacaoIcon,
  Ténis: tenisIcon,
  Tenis: tenisIcon,
  Padel: padelIcon,
  Hóquei: hoqueiIcon,
  Hoquei: hoqueiIcon,
  Ginástica: ginasticaIcon,
  Ginastica: ginasticaIcon,
  Karaté: karateIcon,
  Karate: karateIcon,
  Judo: judoIcon,
  Taekwondo: taekwondoIcon,
  Escalada: escaladaIcon,
  Patinagem: patinagemIcon,
  "Ténis de Mesa": tenisMesaIcon,
  "Tenis de Mesa": tenisMesaIcon,
  default: defaultIcon,
};

export function normalizeModalidadeName(nome) {
  return String(nome || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getModalidadeIcon(nome) {
  const n = normalizeModalidadeName(nome);
  const byName = {
    futebol: futebolIcon,
    basquetebol: basquetebolIcon,
    andebol: andebolIcon,
    futsal: futsalIcon,
    voleibol: voleibolIcon,
    atletismo: atletismoIcon,
    natacao: natacaoIcon,
    tenis: tenisIcon,
    padel: padelIcon,
    hoquei: hoqueiIcon,
    ginastica: ginasticaIcon,
    karate: karateIcon,
    judo: judoIcon,
    taekwondo: taekwondoIcon,
    escalada: escaladaIcon,
    patinagem: patinagemIcon,
    "tenis de mesa": tenisMesaIcon,
  };
  return byName[n] || defaultIcon;
}
