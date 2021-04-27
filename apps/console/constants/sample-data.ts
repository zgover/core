/**
 * @license
 * Copyright (c) 2021 Aglyn LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the root directory of this source tree.
 */

export const samplePageData = [
  {
    $id: 'root1',
    component: 'root',
    props: {
      children: 'hello',
    },
    children: [
      {
        $id: 'root1',
        component: 'root',
        props: {
          children: 'hello',
        },
      },
      {
        $id: 'root2',
        component: 'root',
        props: {
          children: 'hello',
        },
      },
      {
        $id: 'root3',
        component: 'root',
        props: {
          children: 'hello',
        },
      },
    ],
  },
  {
    $id: 'root2',
    component: 'root',
    props: {
      children: 'hello',
    },
    children: [
      {
        $id: 'root1',
        component: 'root',
        props: {
          children: 'hello',
        },
      },
      {
        $id: 'root2',
        component: 'root',
        props: {
          children: 'hello',
        },
      },
      {
        $id: 'root3',
        component: 'root',
        props: {
          children: 'hello',
        },
      },
    ],
  },
  {
    $id: 'root3',
    component: 'root',
    props: {
      children: 'hello',
    },
    children: [
      {
        $id: 'root1',
        component: 'root',
        props: {
          children: 'hello',
        },
      },
      {
        $id: 'root2',
        component: 'root',
        props: {
          children: 'hello',
        },
      },
      {
        $id: 'root3',
        component: 'root',
        props: {
          children: 'hello',
        },
      },
    ],
  },
]
